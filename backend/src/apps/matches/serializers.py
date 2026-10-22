# -*- coding: utf-8 -*-
import datetime

from rest_framework import serializers

from apps.sports.serializers import SeasonSerializer, VenueSerializer

from .models import Match, MatchEvent


class _TeamLiteSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    name = serializers.CharField()
    short_name = serializers.CharField()
    logo_url = serializers.CharField()


class _CompetitionLiteSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    name = serializers.CharField()
    slug = serializers.CharField()


class MatchSerializer(serializers.ModelSerializer):
    # Toujours en UTC ("...Z") : le fuseau d'affichage est decide par le client.
    kickoff_at = serializers.DateTimeField(default_timezone=datetime.timezone.utc)
    competition = _CompetitionLiteSerializer(read_only=True)
    home_team = _TeamLiteSerializer(read_only=True)
    away_team = _TeamLiteSerializer(read_only=True)
    season = serializers.CharField(source="season.label", read_only=True)
    round = serializers.IntegerField(source="round.number", read_only=True, default=None)
    venue = serializers.CharField(source="venue.name", read_only=True, default="")

    class Meta:
        model = Match
        fields = (
            "id", "kickoff_at", "status", "score_home", "score_away",
            "competition", "season", "round", "home_team", "away_team", "venue",
        )


class MatchEventSerializer(serializers.ModelSerializer):
    team_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = MatchEvent
        fields = ("id", "minute", "extra_minute", "type", "team_id", "player_name")


class MatchDetailSerializer(MatchSerializer):
    venue = VenueSerializer(read_only=True)
    events = MatchEventSerializer(many=True, read_only=True)

    class Meta(MatchSerializer.Meta):
        fields = MatchSerializer.Meta.fields + ("referee", "weather", "events")
