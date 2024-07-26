import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const CHUNK_SIZE = 100;
const PAGE_SIZE = 50;

const Index = () => {
  const [csvData, setCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const fileInputRef = useRef(null);
  const fileReaderRef = useRef(null);

  const processChunk = useCallback((reader) => {
    reader.read().then(({ done, value }) => {
      if (done) {
        setIsLoading(false);
        return;
      }

      const chunk = new TextDecoder().decode(value);
      const rows = chunk.split('\n');

      setCsvData((prevData) => {
        const newData = [...prevData, ...rows.map(row => row.split(',').map(cell => cell.trim()))];
        setTotalRows(newData.length - 1); // Subtract 1 to exclude header row
        return newData;
      });

      processChunk(reader);
    });
  }, []);

  const handleFileUpload = () => {
    const file = fileInputRef.current.files[0];
    if (!file) {
      setError('Please select a CSV file first.');
      return;
    }

    setIsLoading(true);
    setError('');
    setCsvData([]);
    setHeaders([]);
    setCurrentPage(1);
    setTotalRows(0);

    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target.result;
      const headerRow = text.split('\n')[0];
      setHeaders(headerRow.split(',').map(header => header.trim()));

      const blob = new Blob([text.substring(text.indexOf('\n') + 1)], { type: 'text/csv' });
      const streamReader = blob.stream().getReader();
      fileReaderRef.current = streamReader;
      processChunk(streamReader);
    };

    reader.onerror = () => {
      setError('An error occurred while reading the file.');
      setIsLoading(false);
    };

    reader.readAsText(file);
  };

  const paginatedData = csvData.slice(1).slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const totalPages = Math.ceil(totalRows / PAGE_SIZE);

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
            <Button onClick={handleFileUpload} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Upload CSV'}
            </Button>
          </div>
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {headers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>CSV Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((header, index) => (
                      <TableHead key={index}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <div>
                Showing {(currentPage - 1) * PAGE_SIZE + 1} to {Math.min(currentPage * PAGE_SIZE, totalRows)} of {totalRows} rows
              </div>
              <div className="space-x-2">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Index;