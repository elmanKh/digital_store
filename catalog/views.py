from django.shortcuts import render
from .models import Product


def index(request):
    products = Product.objects.all()
    lang = request.GET.get('lang', 'en')
    if lang not in ('en', 'az'):
        lang = 'en'

    context = {
        'products': products,
        'lang': lang,
    }
    return render(request, 'index.html', context)