from django.urls import path
from .views import AirtimePurchaseView

urlpatterns = [
    path('airtime/', AirtimePurchaseView.as_view(), name='airtime-purchase'),
]