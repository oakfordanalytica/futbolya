"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Lineup } from "@/lib/mocks/types";
import { FootballField } from "@/components/ui/football-field";
import { PlayerList } from "@/components/sections/match/player-list";

interface MatchLineupsProps {
  lineups: {
    team1: Lineup;
    team2: Lineup;
  };
}

export function MatchLineups({ lineups }: MatchLineupsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Lineups</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="team1" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="team1">{lineups.team1.teamName}</TabsTrigger>
            <TabsTrigger value="team2">{lineups.team2.teamName}</TabsTrigger>
          </TabsList>
          <TabsContent value="team1" className="mt-4">
            <FootballField lineup={lineups.team1} />
            <PlayerList lineup={lineups.team1} className="mt-4" />
          </TabsContent>
          <TabsContent value="team2" className="mt-4">
            <FootballField lineup={lineups.team2} />
            <PlayerList lineup={lineups.team2} className="mt-4" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}