from django.urls import path
from .views import AirtimePurchaseView, DataPurchaseView, ElectricityPurchaseView

urlpatterns = [
    path('airtime/', AirtimePurchaseView.as_view(), name='airtime-purchase'),
    path('data/', DataPurchaseView.as_view(), name='data-purchase'),
    path('electricity/', ElectricityPurchaseView.as_view(), name='electricity-purchase'),
]