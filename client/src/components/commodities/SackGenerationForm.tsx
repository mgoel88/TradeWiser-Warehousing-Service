import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

type SackGenerationFormProps = {
  receiptId: number;
  onSuccess: () => void;
  defaultWeight?: number;
};

// Define the form schema
const formSchema = z.object({
  weight: z.coerce
    .number()
    .positive("Weight must be a positive number")
    .min(10, "Weight must be at least 10 kg")
    .max(100, "Weight cannot exceed 100 kg"),
  quantity: z.coerce
    .number()
    .int("Number of sacks must be a whole number")
    .positive("Number of sacks must be a positive number")
    .min(1, "At least 1 sack must be generated")
    .max(1000, "Cannot generate more than 1000 sacks at once"),
  generateQrCodes: z.boolean().default(true),
  isOwnerHidden: z.boolean().default(false),
});

export function SackGenerationForm({ receiptId, onSuccess, defaultWeight = 50 }: SackGenerationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      weight: defaultWeight,
      quantity: 1,
      generateQrCodes: true,
      isOwnerHidden: false,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", "/api/commodity-sacks/batch", {
        receiptId,
        weight: values.weight,
        quantity: values.quantity,
        generateQrCodes: values.generateQrCodes,
        isOwnerHidden: values.isOwnerHidden,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate sacks");
      }

      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['/api/commodity-sacks'] });
      
      toast({
        title: "Success!",
        description: `Generated ${values.quantity} sacks successfully`,
      });
      
      onSuccess();
    } catch (error) {
      console.error("Error generating sacks:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sack Weight (kg)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="50"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Standard weight per sack
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Sacks</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="1"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  How many sacks to generate
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="generateQrCodes"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>Generate QR Codes</FormLabel>
                <FormDescription>
                  Create unique QR codes for physical tracking
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isOwnerHidden"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>Privacy Mode</FormLabel>
                <FormDescription>
                  Hide owner information on the blockchain
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <AlertDialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Sacks"
            )}
          </Button>
        </AlertDialogFooter>
      </form>
    </Form>
  );
}