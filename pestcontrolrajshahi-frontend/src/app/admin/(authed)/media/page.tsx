"use client";

import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cld } from "@/lib/cloudinary";

export default function AdminMedia() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-media"], queryFn: () => apiGet("/admin/media?limit=60") });
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const isVideo = file.type.startsWith("video/");
        const sign = await apiPost<any>("/admin/media/sign", {
          resourceType: isVideo ? "video" : "image",
        });
        const formData = new FormData();
        formData.append("file", file);
        formData.append("timestamp", String(sign.timestamp));
        formData.append("api_key", sign.apiKey);
        formData.append("signature", sign.signature);
        formData.append("folder", sign.folder);
        const url = `https://api.cloudinary.com/v1_1/${sign.cloudName}/${sign.resourceType}/upload`;
        const upload = await axios.post(url, formData);
        const data = upload.data;
        await apiPost("/admin/media/record", {
          publicId: data.public_id,
          url: data.secure_url,
          resourceType: sign.resourceType,
          format: data.format,
          width: data.width,
          height: data.height,
          duration: data.duration,
          bytes: data.bytes,
        });
      }
      toast.success("Upload complete");
      qc.invalidateQueries({ queryKey: ["admin-media"] });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Media library</h1>
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Button onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {(q.data?.items || []).map((m: any) => (
          <Card key={m.id} className="overflow-hidden">
            <div className="aspect-square bg-muted">
              {m.resourceType === "VIDEO" ? (
                <video src={m.url} controls className="size-full object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cld(m.publicId, { w: 320 })} alt={m.alt || ""} className="size-full object-cover" />
              )}
            </div>
            <CardContent className="p-2 text-xs">
              <div className="truncate">{m.publicId.split("/").pop()}</div>
              <div className="flex items-center justify-between mt-1 text-muted-foreground">
                <span>{m.resourceType}</span>
                <button
                  onClick={async () => {
                    if (!confirm("Delete this asset?")) return;
                    await apiDelete(`/admin/media/${m.id}`);
                    qc.invalidateQueries({ queryKey: ["admin-media"] });
                    toast.success("Deleted");
                  }}
                  className="text-destructive hover:underline"
                >
                  Delete
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
