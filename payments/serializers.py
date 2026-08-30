from rest_framework import serializers
from decimal import Decimal


class AirtimeSerializer(serializers.Serializer):
    NETWORK_CHOICES = ['MTN', 'Vodacom', 'Cell C', 'Telkom']

    phone_number = serializers.CharField(max_length=15)
    network = serializers.ChoiceField(choices=NETWORK_CHOICES)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('0.01'))
    
    
class DataSerializer(serializers.Serializer):
    NETWORK_CHOICES = ['MTN', 'Vodacom', 'Cell C', 'Telkom']

    phone_number = serializers.CharField(max_length=15)
    network = serializers.ChoiceField(choices=NETWORK_CHOICES)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('0.01'))