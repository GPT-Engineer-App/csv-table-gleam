import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

const PAGE_SIZE = 50;
const STORAGE_KEY = 'csvFileReference';
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const Index = () => {
  const [csvData, setCsvData] = useState([]);
  const [enrichProgress, setEnrichProgress] = useState(0);
  const [headers, setHeaders] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  const [isEnrichingAll, setIsEnrichingAll] = useState(false);
  const [enrichedCount, setEnrichedCount] = useState(0);
  const [totalEnrichTime, setTotalEnrichTime] = useState(0);

  const handleReadMore = (rowIndex) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowIndex]: !prev[rowIndex]
    }));
  };
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const fileInputRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    const storedFileName = localStorage.getItem(STORAGE_KEY);
    if (storedFileName) {
      setFileName(storedFileName);
    }
  }, []);

  const processFile = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const rows = text.split('\n');
      const headers = rows[0].split(',').map(header => header.trim());
      setHeaders(headers);
      setTotalRows(rows.length - 1);
      
      const startIndex = (currentPage - 1) * PAGE_SIZE + 1;
      const endIndex = Math.min(startIndex + PAGE_SIZE, rows.length);
      const pageData = rows.slice(startIndex, endIndex).map((row, index) => {
        const rowIndex = startIndex + index - 1;
        const cachedData = localStorage.getItem(`enriched_row_${rowIndex}`);
        const parsedCachedData = cachedData ? JSON.parse(cachedData) : null;
        return {
          isEnriched: parsedCachedData ? parsedCachedData.isEnriched : false,
          data: row.split(',').map(cell => cell.trim()),
          enrichedData: parsedCachedData ? parsedCachedData.enrichedData : null
        };
      });
      
      setCsvData(pageData);
      
      // Calculate initial progress based on cached data
      const initialProgress = pageData.filter(row => row.isEnriched).length / pageData.length * 100;
      setEnrichProgress(initialProgress);
      setIsLoading(false);
    };
    reader.onerror = () => {
      setError('An error occurred while reading the file.');
      setIsLoading(false);
    };
    reader.readAsText(file);
  }, [currentPage]);

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
    setFileName(file.name);
    setFileSize(file.size);
    fileRef.current = file;

    localStorage.setItem(STORAGE_KEY, file.name);
    processFile(file);
  };

  const clearStoredData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCsvData([]);
    setHeaders([]);
    setFileName('');
    setTotalRows(0);
    setCurrentPage(1);
    setFileSize(0);
    fileRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const changePage = (newPage) => {
    setCurrentPage(newPage);
    setIsLoading(true);
    if (fileRef.current) {
      processFile(fileRef.current);
    } else {
      setIsLoading(false);
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

  const handleEnrichAll = async () => {
    setIsEnrichingAll(true);
    setEnrichProgress(0);
    setEnrichedCount(0);
    setTotalEnrichTime(0);

    for (let i = 0; i < csvData.length; i++) {
      if (!csvData[i].isEnriched) {
        const startTime = Date.now();
        await handleEnrich(i);
        const endTime = Date.now();
        setTotalEnrichTime(prev => prev + (endTime - startTime));
        setEnrichedCount(prev => prev + 1);
      }
      setEnrichProgress((i + 1) / csvData.length * 100);
    }

    setIsEnrichingAll(false);
    toast.success('All rows have been enriched!');
  };

  const handleEnrich = async (rowIndex) => {
    if (csvData[rowIndex].isEnriched) return;

    const updatedCsvData = [...csvData];
    updatedCsvData[rowIndex] = { ...updatedCsvData[rowIndex], isLoading: true };
    setCsvData(updatedCsvData);

    try {
      if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API key is not set. Please check your environment variables.');
      }

      const row = updatedCsvData[rowIndex];
      const locationData = row.data.join(', '); // Assuming all columns contain location data

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that provides brief and informative descriptions of locations."
            },
            {
              role: "user",
              content: `Provide a brief and informative description of this location: ${locationData}`
            }
          ]
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch from OpenAI API');
      }

      const aiDescription = data.choices[0].message.content;
      const descriptionWithDisclaimer = `${aiDescription}\n\nDisclaimer: This description was generated by AI and may contain inaccuracies.`;

      setCsvData(prevData => 
        prevData.map((row, index) => 
          index === rowIndex ? { ...row, isEnriched: true, enrichedData: descriptionWithDisclaimer } : row
        )
      );

      // Update progress
      setEnrichProgress(prev => prev + (100 / csvData.length));

      // Save to local storage
      localStorage.setItem(`enriched_row_${rowIndex}`, JSON.stringify({ isEnriched: true, enrichedData: descriptionWithDisclaimer }));

      toast.success(`Row ${rowIndex + 1} enriched successfully!`);
    } catch (error) {
      console.error('Error enriching data:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      toast.error(`Failed to enrich row ${rowIndex + 1}: ${errorMessage}. Please try again.`);
      
      // Reset loading state
      const updatedCsvData = [...csvData];
      updatedCsvData[rowIndex] = { ...updatedCsvData[rowIndex], isLoading: false };
      setCsvData(updatedCsvData);
    }
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
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Enrich Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <Button 
                onClick={handleEnrichAll} 
                disabled={isEnrichingAll || enrichProgress === 100}
              >
                {isEnrichingAll ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enriching...
                  </>
                ) : enrichProgress === 100 ? (
                  'All Enriched'
                ) : (
                  'Enrich All'
                )}
              </Button>
              <div className="text-sm text-muted-foreground">
                Enriched: {enrichedCount} / {csvData.length} rows
              </div>
            </div>
            <Progress value={enrichProgress} className="mb-2" />
            <div className="text-sm text-muted-foreground flex justify-between">
              <span>Progress: {enrichProgress.toFixed(2)}%</span>
              {totalEnrichTime > 0 && (
                <span>
                  Avg. Time per Row: {(totalEnrichTime / enrichedCount / 1000).toFixed(2)}s
                </span>
              )}
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
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Enrich</TableHead>
                    {headers.map((header, index) => (
                      <TableHead key={index}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvData.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      <TableCell>
                        <Button
                          onClick={() => handleEnrich(rowIndex)}
                          disabled={row.isEnriched || row.isLoading}
                          size="sm"
                        >
                          {row.isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Enriching...
                            </>
                          ) : row.isEnriched ? (
                            'Enriched'
                          ) : (
                            'Enrich'
                          )}
                        </Button>
                      </TableCell>
                      {row.data.map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>{cell}</TableCell>
                      ))}
                      <TableCell className="max-w-md">
                        {row.enrichedData ? (
                          <>
                            <div className={`whitespace-normal break-words ${expandedRows[rowIndex] ? '' : 'line-clamp-2'}`}>
                              {row.enrichedData.split('\n\nDisclaimer:')[0]}
                            </div>
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="mt-1 p-0 h-auto font-normal"
                              onClick={() => handleReadMore(rowIndex)}
                            >
                              {expandedRows[rowIndex] ? 'Show less' : 'Read more'}
                            </Button>
                            <div className={`mt-2 text-xs text-gray-500 italic whitespace-normal break-words ${expandedRows[rowIndex] ? '' : 'line-clamp-1'}`}>
                              Disclaimer: {row.enrichedData.split('\n\nDisclaimer:')[1]}
                            </div>
                          </>
                        ) : (
                          'Not enriched yet'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
              </div>
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
