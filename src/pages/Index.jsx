import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';

const PAGE_SIZE = 50;
const DB_NAME = 'CsvStorage';
const STORE_NAME = 'csvFiles';

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

  const openDatabase = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        db.createObjectStore(STORE_NAME, { keyPath: 'fileName' });
      };
    });
  };

  const saveToIndexedDB = async (fileName, content) => {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ fileName, content });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  };

  const loadFromIndexedDB = async (fileName) => {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(fileName);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result?.content);
    });
  };

  const processFile = useCallback(async (content) => {
    setIsLoading(true);
    const rows = content.split('\n');
    const headers = rows[0].split(',').map(header => header.trim());
    setHeaders(['Action', ...headers]);
    setTotalRows(rows.length - 1);
    
    const startIndex = (currentPage - 1) * PAGE_SIZE + 1;
    const endIndex = Math.min(startIndex + PAGE_SIZE, rows.length);
    const pageData = rows.slice(startIndex, endIndex).map(row => ['', ...row.split(',').map(cell => cell.trim())]);
    
    setCsvData(pageData);
    setIsLoading(false);
  }, [currentPage]);

  const loadSavedFile = useCallback(async () => {
    try {
      const savedFileName = localStorage.getItem('savedFileName');
      if (savedFileName) {
        const content = await loadFromIndexedDB(savedFileName);
        if (content) {
          setFileName(savedFileName);
          setFileSize(new Blob([content]).size);
          await processFile(content);
        }
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
      const content = await file.text();
      await saveToIndexedDB(file.name, content);
      localStorage.setItem('savedFileName', file.name);

      setFileName(file.name);
      setFileSize(file.size);
      setCurrentPage(1);
      await processFile(content);
    } catch (err) {
      console.error('Error saving file:', err);
      setError('Failed to save the file. Please try again.');
    }
  };

  const clearStoredData = async () => {
    try {
      const db = await openDatabase();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      await store.clear();
      localStorage.removeItem('savedFileName');
      
      setCsvData([]);
      setHeaders([]);
      setFileName('');
      setTotalRows(0);
      setCurrentPage(1);
      setFileSize(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error clearing stored data:', err);
      setError('Failed to clear stored data. Please try again.');
    }
  };

  const changePage = async (newPage) => {
    setCurrentPage(newPage);
    const content = await loadFromIndexedDB(fileName);
    if (content) {
      await processFile(content);
    } else {
      setError('File content not found. Please upload the file again.');
    }
  };

  // ... (keep the formatFileSize, handleDragStart, handleDragOver, handleDrop, and handleActionClick functions as they were)

  // ... (keep the return statement and JSX as it was in the previous version)

};

export default Index;