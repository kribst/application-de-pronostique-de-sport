# -*- coding: utf-8 -*-
from rest_framework import serializers

from .models import Competition, Country, Season, Sport, SportMarket, Team, TeamSeasonStat, Venue


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


class VenueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Venue
        fields = ("id", "name", "city", "capacity")


class TeamSerializer(serializers.ModelSerializer):
    sport = serializers.SlugRelatedField(read_only=True, slug_field="slug")
    country = CountrySerializer(read_only=True)
    stadium = serializers.SerializerMethodField()
    league = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = (
            "id", "name", "short_name", "slug", "sport", "country", "logo_url",
            "stadium", "league",
        )

    def get_stadium(self, obj):
        return obj.venue.name if obj.venue_id else ""

    def get_league(self, obj):
        """Championnat de la saison en cours : celui du pays de l'equipe en priorite."""
        stats = getattr(obj, "current_stats", None)
        if not stats:
            return ""
        competitions = [stat.season.competition for stat in stats]
        for competition in competitions:
            if competition.country_id and competition.country_id == obj.country_id:
                return competition.name
        return competitions[0].name


class TeamParticipationSerializer(serializers.ModelSerializer):
    """Une participation de l'equipe : competition + saison (+ stats)."""

    season = SeasonSerializer(read_only=True)
    competition = serializers.SerializerMethodField()

    class Meta:
        model = TeamSeasonStat
        fields = ("competition", "season", "stats")

    def get_competition(self, obj):
        comp = obj.season.competition
        return {"id": str(comp.id), "name": comp.name, "slug": comp.slug}


class TeamDetailSerializer(TeamSerializer):
    venue = VenueSerializer(read_only=True)
    participations = TeamParticipationSerializer(source="season_stats", many=True, read_only=True)

    class Meta(TeamSerializer.Meta):
        fields = TeamSerializer.Meta.fields + ("founded_year", "venue", "participations")
