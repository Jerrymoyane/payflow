from django.urls import path
from .views import HomeView, RegisterPageView, LoginPageView, DashboardPageView, WalletPageView, PaymentsPageView, TransactionsPageView

urlpatterns = [
    path('', HomeView.as_view(), name='home'),
    path('register/', RegisterPageView.as_view(), name='register'),
    path('login/', LoginPageView.as_view(), name='login'),
    path('dashboard/', DashboardPageView.as_view(), name='dashboard'),
    path('wallet/', WalletPageView.as_view(), name='wallet'),
    path('payments/', PaymentsPageView.as_view(), name='payments'),
    path('transactions/', TransactionsPageView.as_view(), name='transactions'),
]