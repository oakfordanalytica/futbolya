import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { matches } from "@/lib/mocks/data";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

export function ScoreboardCompetition() {
  return (
    <Card className="w-full p-3 gap-2 rounded-lg">
      <CardHeader className="px-0">
        <CardTitle className="text-lg">FIFA Under-17 World Cup</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableBody>
            {matches.map((match) => (
              <TableRow key={match.id} href={`/match/${match.id}`}>
                <TableCell className="py-3 w-24">
                  <span className="text-xs text-muted-foreground">
                    {match.status}
                  </span>
                </TableCell>
                <TableCell className="py-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Avatar
                        initials={match.team1Flag}
                        className="size-5"
                        square
                      />
                      <span className="text-sm font-medium">{match.team1}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Avatar
                        initials={match.team2Flag}
                        className="size-5"
                        square
                      />
                      <span className="text-sm font-medium">{match.team2}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right py-3 w-16">
                  <div className="space-y-2">
                    <div className="text-lg font-semibold tabular-nums">
                      {match.score1}
                    </div>
                    <div className="text-lg font-semibold tabular-nums">
                      {match.score2}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
