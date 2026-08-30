from django.urls import path
from .views import WalletView, DepositView

urlpatterns = [
    path('', WalletView.as_view(), name='wallet'),
    path('deposit/', DepositView.as_view(), name='wallet-deposit'),
]