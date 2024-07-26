import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const PAGE_SIZE = 50;
const STORAGE_KEY = 'csvFileHandle';

const Index = () => {
  const [csvData, setCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const fileInputRef = useRef(null);
  const fileHandleRef = useRef(null);

  const processFile = useCallback(async (file) => {
    setIsLoading(true);
    const text = await file.text();
    const rows = text.split('\n');
    const headers = rows[0].split(',').map(header => header.trim());
    setHeaders(headers);
    setTotalRows(rows.length - 1);
    
    const startIndex = (currentPage - 1) * PAGE_SIZE + 1;
    const endIndex = Math.min(startIndex + PAGE_SIZE, rows.length);
    const pageData = rows.slice(startIndex, endIndex).map(row => row.split(',').map(cell => cell.trim()));
    
    setCsvData(pageData);
    setIsLoading(false);
  }, [currentPage]);

  const loadSavedFile = useCallback(async () => {
    try {
      const fileHandle = await JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (fileHandle) {
        fileHandleRef.current = fileHandle;
        const file = await fileHandle.getFile();
        setFileName(file.name);
        setFileSize(file.size);
        await processFile(file);
      }
    } catch (err) {
      console.error('Error loading saved file:', err);
      setError('Failed to load the saved file. Please upload a new one.');
    }
  }, [processFile]);

  useEffect(() => {
    loadSavedFile();
  }, [loadSavedFile]);

  const handleFileUpload = async () => {
    const file = fileInputRef.current.files[0];
    if (!file) {
      setError('Please select a CSV file first.');
      return;
    }

    try {
      const fileHandle = await window.showSaveFilePicker({
        types: [{
          description: 'CSV Files',
          accept: { 'text/csv': ['.csv'] },
        }],
        suggestedName: file.name,
      });
      
      const writable = await fileHandle.createWritable();
      await writable.write(file);
      await writable.close();

      fileHandleRef.current = fileHandle;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fileHandle));

      setFileName(file.name);
      setFileSize(file.size);
      setCurrentPage(1);
      await processFile(file);
    } catch (err) {
      console.error('Error saving file:', err);
      setError('Failed to save the file. Please try again.');
    }
  };

  const clearStoredData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCsvData([]);
    setHeaders([]);
    setFileName('');
    setTotalRows(0);
    setCurrentPage(1);
    setFileSize(0);
    fileHandleRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const changePage = async (newPage) => {
    setCurrentPage(newPage);
    if (fileHandleRef.current) {
      const file = await fileHandleRef.current.getFile();
      await processFile(file);
    } else {
      setError('File reference lost. Please upload the file again.');
    }
  };

  const totalPages = Math.ceil(totalRows / PAGE_SIZE);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>CSV File Uploader</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <Input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              className="flex-grow"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setFileName(file.name);
                  setFileSize(file.size);
                } else {
                  setFileName('');
                  setFileSize(0);
                }
              }}
            />
            <Button onClick={handleFileUpload} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Upload CSV'}
            </Button>
          </div>
          {fileName && (
            <div className="flex items-center justify-between mb-4">
              <span>Current file: {fileName}</span>
              <Button onClick={clearStoredData} variant="outline">Clear Stored Data</Button>
            </div>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {headers.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>CSV Data Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <h3 className="text-sm font-medium">Total Rows</h3>
                <p className="text-2xl font-bold">{totalRows.toLocaleString()}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Total Columns</h3>
                <p className="text-2xl font-bold">{headers.length}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">File Size</h3>
                <p className="text-2xl font-bold">{formatFileSize(fileSize)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Total Pages</h3>
                <p className="text-2xl font-bold">{totalPages}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                  {csvData.map((row, rowIndex) => (
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
                  onClick={() => changePage(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1 || isLoading}
                >
                  Previous
                </Button>
                <Button
                  onClick={() => changePage(Math.min(currentPage + 1, totalPages))}
                  disabled={currentPage === totalPages || isLoading}
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