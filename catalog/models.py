from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils.text import slugify


class Product(models.Model):
    CATEGORY_CHOICES = [
        ("ebook", "E-Books"),
        ("template", "Code Templates"),
        ("ui", "UI & Design"),
    ]

    title_en = models.CharField(max_length=200)
    title_az = models.CharField(max_length=200, blank=True)

    slug = models.SlugField(
        max_length=220,
        unique=True,
        blank=True,
        allow_unicode=True,
    )

    description_en = models.TextField()
    description_az = models.TextField(blank=True)

    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default="template",
    )

    price = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
    )

    # Rəqəmsal məhsulun təhlükəsiz çatdırılması üçün daxili/qorunan resurs açarı və ya fayl yolu
    delivery_note = models.CharField(
        max_length=255,
        blank=True,
        help_text="Internal note or delivery reference after payment confirmation.",
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def get_title(self, lang="en"):
        if lang == "az" and self.title_az:
            return self.title_az
        return self.title_en

    def get_description(self, lang="en"):
        if lang == "az" and self.description_az:
            return self.description_az
        return self.description_en

    def _build_unique_slug(self):
        base_slug = slugify(self.title_en, allow_unicode=True) or "digital-product"
        candidate = base_slug
        counter = 2
        while Product.objects.filter(slug=candidate).exclude(pk=self.pk).exists():
            candidate = f"{base_slug}-{counter}"
            counter += 1
        return candidate

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._build_unique_slug()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title_en


class Cart(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="carts",
        null=True,
        blank=True,
    )
    session_key = models.CharField(max_length=64, blank=True, db_index=True)
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="cart_items",
    )
    quantity = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "product"],
                condition=models.Q(user__isnull=False),
                name="unique_user_product_in_cart",
            ),
            models.UniqueConstraint(
                fields=["session_key", "product"],
                condition=models.Q(user__isnull=True) & ~models.Q(session_key=""),
                name="unique_session_product_in_cart",
            ),
        ]

    @property
    def subtotal(self):
        return self.product.price * self.quantity

    def __str__(self):
        owner = self.user.username if self.user else (self.session_key or "guest")
        return f"{owner} - {self.product.title_en} (x{self.quantity})"


class Order(models.Model):
    STATUS_PENDING = "pending"
    STATUS_PAID = "paid"
    STATUS_DELIVERED = "delivered"
    STATUS_CANCELLED = "cancelled"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_PAID, "Paid"),
        (STATUS_DELIVERED, "Delivered"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="orders",
        null=True,
        blank=True,
    )
    buyer_email = models.EmailField()
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
    )
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    payment_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def recalculate_total(self):
        total = sum(
            (item.unit_price * item.quantity for item in self.items.all()),
            Decimal("0.00"),
        )
        self.total_amount = total
        self.save(update_fields=["total_amount", "updated_at"])
        return total

    def __str__(self):
        return f"Order #{self.pk or 'new'} ({self.status}) - {self.buyer_email}"


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="order_items",
    )
    product_title_snapshot = models.CharField(max_length=200)
    unit_price = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    quantity = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["order", "product"],
                name="unique_product_per_order",
            )
        ]

    @property
    def line_total(self):
        return self.unit_price * self.quantity

    def save(self, *args, **kwargs):
        if not self.product_title_snapshot and self.product_id:
            self.product_title_snapshot = self.product.title_en
        if self.unit_price is None and self.product_id:
            self.unit_price = self.product.price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product_title_snapshot or self.product.title_en} x{self.quantity}"
