# -*- coding: utf-8 -*-
from rest_framework import serializers

from .models import Competition, Country, Season, Sport, SportMarket


class SportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sport
        fields = ("id", "name", "slug", "sport_type", "is_active", "position")


class SportMarketSerializer(serializers.ModelSerializer):
    class Meta:
        model = SportMarket
        fields = ("id", "market_type", "name", "params")


class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = ("id", "name", "code")


class SeasonSerializer(serializers.ModelSerializer):
    label = serializers.CharField(read_only=True)

    class Meta:
        model = Season
        fields = ("id", "label", "year_start", "year_end", "is_current")


class CompetitionSerializer(serializers.ModelSerializer):
    sport = serializers.SlugRelatedField(read_only=True, slug_field="slug")
    country = CountrySerializer(read_only=True)
    current_season = serializers.SerializerMethodField()

    class Meta:
        model = Competition
        fields = ("id", "name", "slug", "tier", "sport", "country", "current_season")

    def get_current_season(self, obj):
        seasons = getattr(obj, "current_seasons", None)
        if seasons is None:
            seasons = list(obj.seasons.filter(is_current=True)[:1])
        return SeasonSerializer(seasons[0]).data if seasons else None


class CompetitionDetailSerializer(CompetitionSerializer):
    seasons = SeasonSerializer(many=True, read_only=True)

    class Meta(CompetitionSerializer.Meta):
        fields = CompetitionSerializer.Meta.fields + ("seasons",)