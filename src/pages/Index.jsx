import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';

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
  const [animateRow, setAnimateRow] = useState(null);
  const [draggedHeader, setDraggedHeader] = useState(null);
  const fileInputRef = useRef(null);
  const fileHandleRef = useRef(null);

  const processFile = useCallback(async (file) => {
    setIsLoading(true);
    const text = await file.text();
    const rows = text.split('\n');
    const headers = rows[0].split(',').map(header => header.trim());
    setHeaders(['Action', ...headers]);
    setTotalRows(rows.length - 1);
    
    const startIndex = (currentPage - 1) * PAGE_SIZE + 1;
    const endIndex = Math.min(startIndex + PAGE_SIZE, rows.length);
    const pageData = rows.slice(startIndex, endIndex).map(row => ['', ...row.split(',').map(cell => cell.trim())]);
    
    setCsvData(pageData);
    setIsLoading(false);
  }, [currentPage]);

  // ... (keep the loadSavedFile, handleFileUpload, clearStoredData, changePage, and formatFileSize functions as they were)

  const handleDragStart = (e, header) => {
    setDraggedHeader(header);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetHeader) => {
    e.preventDefault();
    if (draggedHeader === targetHeader) return;

    const newHeaders = [...headers];
    const draggedIndex = newHeaders.indexOf(draggedHeader);
    const targetIndex = newHeaders.indexOf(targetHeader);

    newHeaders.splice(draggedIndex, 1);
    newHeaders.splice(targetIndex, 0, draggedHeader);

    setHeaders(newHeaders);

    const newCsvData = csvData.map(row => {
      const newRow = Array(newHeaders.length).fill('');
      newHeaders.forEach((header, index) => {
        const oldIndex = headers.indexOf(header);
        newRow[index] = row[oldIndex];
      });
      return newRow;
    });

    setCsvData(newCsvData);
  };

  const handleActionClick = (rowIndex) => {
    setAnimateRow(rowIndex);
    setTimeout(() => setAnimateRow(null), 1000);
  };

  return (
    <div className="container mx-auto p-4">
      {/* ... (keep the file upload Card as it was) */}

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
                    {headers.map((header) => (
                      <TableHead
                        key={header}
                        draggable
                        onDragStart={(e) => handleDragStart(e, header)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, header)}
                        className="cursor-move"
                      >
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvData.map((row, rowIndex) => (
                    <motion.tr
                      key={rowIndex}
                      animate={animateRow === rowIndex ? { scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] } : {}}
                      transition={{ duration: 0.5 }}
                    >
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>
                          {cellIndex === 0 ? (
                            <Button onClick={() => handleActionClick(rowIndex)}>Action</Button>
                          ) : (
                            cell
                          )}
                        </TableCell>
                      ))}
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
            {/* ... (keep the pagination section as it was) */}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Index;