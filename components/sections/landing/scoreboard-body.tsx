import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScoreboardCompetition } from "./scoreboard-competition";

export function ScoreboardBody() {
  return (
    <section className="flex flex-col gap-4">
      <ScoreboardCompetition />
      <ScoreboardCompetition />
      <ScoreboardCompetition />
      <ScoreboardCompetition />
    </section>
  );
}
