from django.shortcuts import render

# Create your views here.

from django.views.generic import TemplateView

class HomeView(TemplateView):
    template_name = "frontend/home.html"


class RegisterPageView(TemplateView):
    template_name = "frontend/register.html"


class LoginPageView(TemplateView):
    template_name = "frontend/login.html"

class HomeView(TemplateView):
    template_name = "frontend/home.html"

class DashboardPageView(TemplateView):
    template_name = "frontend/dashboard.html"