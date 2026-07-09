"use client";

import React, { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";

export default function ImageUploader({ images, onChange }) {
  const [isDragging, setIsDragging] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef(null);

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 600;
          let width = img.width;
          let height = img.height;

          // Downscale calculations
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 0.75 quality
          const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
          resolve(dataUrl);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (fileList) => {
    setCompressing(true);
    const newImages = [...images];
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.type.startsWith("image/")) {
        try {
          const compressed = await compressImage(file);
          newImages.push(compressed);
        } catch (error) {
          console.error("Compression error:", error);
        }
      }
    }

    onChange(newImages);
    setCompressing(false);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const onFileChange = (e) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeImage = (indexToRemove) => {
    onChange(images.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-slate-700">
        Activity Photos
      </label>

      {/* Drag & Drop Area */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? "border-blue-500 bg-blue-50/50"
            : "border-slate-200 hover:border-blue-400 bg-slate-50/30 hover:bg-slate-50/80"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileChange}
          accept="image/*"
          multiple
          className="hidden"
        />
        
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="p-3 bg-white rounded-full shadow-sm border border-slate-100 text-blue-600">
            <Upload className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">
              Drag & drop photos here, or <span className="text-blue-600 underline">browse</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports JPEG, PNG (Auto-compressed to stay within size limits)
            </p>
          </div>
        </div>
      </div>

      {compressing && (
        <div className="text-xs text-blue-600 flex items-center space-x-1.5 animate-pulse">
          <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
          <span>Optimizing and compressing images...</span>
        </div>
      )}

      {/* Thumbnails list */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {images.map((img, idx) => (
            <div key={idx} className="relative group aspect-square rounded-md overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={`Upload preview ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(idx);
                }}
                className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-600 text-white rounded-full transition-colors opacity-100 sm:opacity-0 group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
