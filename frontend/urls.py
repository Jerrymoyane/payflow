from django.urls import path
from .views import HomeView, RegisterPageView, LoginPageView, DashboardPageView

urlpatterns = [
    path('', HomeView.as_view(), name='home'),
    path('register/', RegisterPageView.as_view(), name='register'),
    path('login/', LoginPageView.as_view(), name='login'),
    path('dashboard/', DashboardPageView.as_view(), name='dashboard'),
]