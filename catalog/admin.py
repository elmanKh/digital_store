from django.contrib import admin

from .models import Cart, Order, OrderItem, Product


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("product", "product_title_snapshot", "unit_price", "quantity", "line_total")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("title_en", "title_az", "category", "price", "is_active", "created_at")
    list_filter = ("category", "is_active", "created_at")
    search_fields = ("title_en", "title_az", "description_en", "description_az", "slug")
    prepopulated_fields = {"slug": ("title_en",)}
    list_editable = ("price", "is_active")


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "session_key", "product", "quantity", "subtotal", "updated_at")
    list_filter = ("updated_at",)
    search_fields = ("user__username", "session_key", "product__title_en")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "buyer_email", "user", "status", "payment_verified", "total_amount", "created_at")
    list_filter = ("status", "payment_verified", "created_at")
    search_fields = ("buyer_email", "user__username")
    inlines = [OrderItemInline]


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "product_title_snapshot", "unit_price", "quantity", "line_total")
    search_fields = ("product_title_snapshot", "order__buyer_email")