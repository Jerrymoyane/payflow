from django.db import models

# Create your models here.

from django.db import models
from django.conf import settings
import uuid
from datetime import datetime


def generate_reference():
    year = datetime.now().year
    unique_part = uuid.uuid4().hex[:6].upper()
    return f"PF-{year}-{unique_part}"


class Transaction(models.Model):
    TYPE_CHOICES = [
        ('DEPOSIT', 'Deposit'),
        ('WITHDRAWAL', 'Withdrawal'),
        ('AIRTIME', 'Airtime'),
        ('DATA', 'Data'),
        ('ELECTRICITY', 'Electricity'),
    ]
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
        ('CANCELLED', 'Cancelled'),
    ]

    reference = models.CharField(max_length=20, unique=True, default=generate_reference)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    wallet = models.ForeignKey('wallets.Wallet', on_delete=models.CASCADE, related_name='transactions')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    description = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.reference} - {self.type} - {self.amount}"