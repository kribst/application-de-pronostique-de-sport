# -*- coding: utf-8 -*-
"""Models de l'app admin - Donnees pour l'interface d'administration."""
from django.db import models
from django.utils import timezone
import uuid


class ContactMessage(models.Model):
    """Messages recus via le formulaire public de contact."""
    STATUT_CHOICES = [
        ("nouveau", "Nouveau"),
        ("en_cours", "En cours"),
        ("traite", "Traite"),
        ("archive", "Archive"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom = models.CharField(max_length=255, verbose_name="Nom complet")
    email = models.EmailField(verbose_name="Email")
    objet = models.CharField(max_length=255, verbose_name="Sujet")
    message = models.TextField(verbose_name="Message")
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default="nouveau",
        verbose_name="Statut",
    )
    createdAt = models.DateTimeField(auto_now_add=True, verbose_name="Date de creation")
    expiresAt = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Date d'expiration",
    )

    class Meta:
        verbose_name = "Message de contact"
        verbose_name_plural = "Messages de contact"
        ordering = ["-createdAt"]
        indexes = [
            models.Index(fields=["statut"]),
            models.Index(fields=["-createdAt"]),
        ]

    def __str__(self):
        return f"{self.nom} - {self.objet} ({self.get_statut_display()})"

    @property
    def is_expired(self):
        if not self.expiresAt:
            return False
        return self.expiresAt < timezone.now()


class SiteContent(models.Model):
    """Contenu editable du site (societe, services, statistiques, etc.)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    version = models.IntegerField(default=1, verbose_name="Version")
    companyName = models.CharField(max_length=255, verbose_name="Nom de la societe")
    siret = models.CharField(max_length=14, blank=True, verbose_name="Siret")
    adresse = models.TextField(blank=True, verbose_name="Adresse")
    codePostal = models.CharField(max_length=20, blank=True, verbose_name="Code postal")
    ville = models.CharField(max_length=100, blank=True, verbose_name="Ville")
    pays = models.CharField(max_length=100, blank=True, verbose_name="Pays")
    email = models.EmailField(blank=True, verbose_name="Email")
    telephone = models.CharField(max_length=50, blank=True, verbose_name="Telephone")
    siteWeb = models.URLField(blank=True, verbose_name="Site web")
    logo = models.URLField(blank=True, verbose_name="URL du logo")
    favicon = models.URLField(blank=True, verbose_name="URL du favicon")
    googleMaps = models.TextField(blank=True, verbose_name="Google Maps")
    legalNotes = models.TextField(blank=True, verbose_name="Notes legal")
    contactPageNotes = models.TextField(blank=True, verbose_name="Page contact")
    aboutPageNotes = models.TextField(blank=True, verbose_name="Page a propos")
    termsPageNotes = models.TextField(blank=True, verbose_name="Page conditions")

    class Meta:
        verbose_name = "Contenu du site"
        verbose_name_plural = "Contenus du site"
        ordering = ["-version"]

    def __str__(self):
        return f"Contenu {self.companyName} (v{self.version})"

