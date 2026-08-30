from django.db import models

# Create your models here.
from django.conf import settings


# We use Decimal (via DecimalField) instead of a float for monetary values.
class Wallet(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='wallet'
    )
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default='ZAR')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email}'s wallet - {self.balance} {self.currency}"




from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_wallet_for_new_user(sender, instance, created, **kwargs):
    if created:
        Wallet.objects.create(user=instance)