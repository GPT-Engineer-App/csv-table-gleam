import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Index = () => {
  const [csvData, setCsvData] = useState([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileUpload = () => {
    const file = fileInputRef.current.files[0];
    if (!file) {
      setError('Please select a CSV file first.');
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target.result;
      const rows = text.split('\n');
      const parsedData = rows.map(row => row.split(',').map(cell => cell.trim()));
      
      if (parsedData.length < 2) {
        setError('The CSV file appears to be empty or invalid.');
        return;
      }

      setCsvData(parsedData);
      setError('');
    };

    reader.onerror = () => {
      setError('An error occurred while reading the file.');
    };

    reader.readAsText(file);
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>CSV File Uploader</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              className="flex-grow"
            />
            <Button onClick={handleFileUpload}>Upload CSV</Button>
          </div>
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {csvData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>CSV Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {csvData[0].map((header, index) => (
                      <TableHead key={index}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvData.slice(1).map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Index;