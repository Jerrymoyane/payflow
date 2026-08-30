from django.shortcuts import render

# Create your views here.

from rest_framework import generics, permissions
from django_filters.rest_framework import DjangoFilterBackend
from .models import Transaction
from .serializers import TransactionSerializer


class TransactionListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TransactionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'type', 'created_at']

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).order_by('-created_at')
