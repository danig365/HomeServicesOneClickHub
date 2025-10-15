// utils/fileUpload.ts
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase';

interface UploadResult {
  url: string;
  path: string;
  size: number;
  type: string;
}

interface FileInfo {
  uri: string;
  name: string;
  type?: string;
  size?: number;
}

/**
 * Get file info from URI
 */
async function getFileDetails(fileUri: string, fileName?: string): Promise<FileInfo> {
  try {
    const info = await FileSystem.getInfoAsync(fileUri);
    const name = fileName || fileUri.split('/').pop() || 'unknown';
    const extension = name.split('.').pop()?.toLowerCase() || '';
    
    return {
      uri: fileUri,
      name: name,
      type: getContentType(extension),
      size: 'size' in info ? info.size : 0,
    };
  } catch (error) {
    console.error('[FileUpload] Error getting file details:', error);
    return {
      uri: fileUri,
      name: fileName || 'unknown',
      type: 'application/octet-stream',
      size: 0,
    };
  }
}

/**
 * Uploads a file to Supabase Storage
 */
export async function uploadFileToSupabase(
  fileUri: string,
  bucket: string,
  folder: string,
  fileName?: string
): Promise<UploadResult> {
  try {
    console.log(`[FileUpload] Starting upload to ${bucket}/${folder}`);
    console.log(`[FileUpload] File URI: ${fileUri}`);

    // Get file details
    const fileInfo = await getFileDetails(fileUri, fileName);
    console.log(`[FileUpload] File info:`, fileInfo);

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = fileInfo.name.split('.').pop() || 'file';
    const uniqueFileName = `${timestamp}-${randomString}.${extension}`;
    const filePath = `${folder}/${uniqueFileName}`;

    console.log(`[FileUpload] Upload path: ${filePath}`);

    // Read file as base64
    console.log(`[FileUpload] Reading file...`);
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log(`[FileUpload] File read, size: ${base64.length} chars`);

    // Convert base64 to ArrayBuffer
    const arrayBuffer = decode(base64);
    console.log(`[FileUpload] Converted to ArrayBuffer: ${arrayBuffer.byteLength} bytes`);

    // Upload to Supabase
    console.log(`[FileUpload] Uploading to Supabase...`);
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, arrayBuffer, {
        contentType: fileInfo.type,
        upsert: false,
      });

    if (error) {
      console.error('[FileUpload] Upload error:', error);
      throw error;
    }

    console.log(`[FileUpload] Upload successful:`, data);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    console.log(`[FileUpload] Public URL: ${publicUrl}`);

    return {
      url: publicUrl,
      path: filePath,
      size: fileInfo.size || 0,
      type: fileInfo.type || 'application/octet-stream',
    };
  } catch (error) {
    console.error('[FileUpload] Upload failed:', error);
    throw error;
  }
}

/**
 * Upload image to storage
 */
export async function uploadImage(
  imageUri: string,
  userId: string
): Promise<UploadResult> {
  return uploadFileToSupabase(imageUri, 'document-images', userId);
}

/**
 * Upload document to storage
 */
export async function uploadDocument(
  documentUri: string,
  userId: string,
  fileName?: string
): Promise<UploadResult> {
  return uploadFileToSupabase(documentUri, 'documents', userId, fileName);
}

/**
 * Delete file from storage
 */
export async function deleteFileFromSupabase(
  bucket: string,
  filePath: string
): Promise<void> {
  try {
    console.log(`[FileUpload] Deleting ${bucket}/${filePath}`);
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('[FileUpload] Delete error:', error);
      throw error;
    }

    console.log(`[FileUpload] Delete successful`);
  } catch (error) {
    console.error('[FileUpload] Delete failed:', error);
    throw error;
  }
}

/**
 * Get content type from extension
 */
function getContentType(extension: string): string {
  const types: Record<string, string> = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    txt: 'text/plain',
    csv: 'text/csv',
    
    // Other
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
  };

  return types[extension.toLowerCase()] || 'application/octet-stream';
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}