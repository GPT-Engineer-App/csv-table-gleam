import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

const ScannedData = () => {
  const [isEnriched, setIsEnriched] = useState(false);

  const handleEnrich = () => {
    setIsEnriched(true);
    // Add your enrichment logic here
    console.log('Enriching data...');
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Scanned Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Enrich</TableHead>
                  <TableHead>Column 1</TableHead>
                  <TableHead>Column 2</TableHead>
                  <TableHead>Column 3</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <Button 
                      onClick={handleEnrich} 
                      disabled={isEnriched}
                    >
                      {isEnriched ? 'Enriched' : 'Enrich'}
                    </Button>
                  </TableCell>
                  <TableCell>Data 1</TableCell>
                  <TableCell>Data 2</TableCell>
                  <TableCell>Data 3</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScannedData;
