"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import imageCompression from "browser-image-compression";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { signOut } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ImagePlus, Lock, Loader2 } from "lucide-react";

const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "이름은 2글자 이상이어야 합니다.",
  }),
  email: z.string().email({
    message: "올바른 이메일 주소를 입력해주세요.",
  }),
});

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(6, {
      message: "현재 비밀번호를 입력해주세요.",
    }),
    newPassword: z.string().min(6, {
      message: "비밀번호는 6자 이상이어야 합니다.",
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "새 비밀번호가 일치하지 않습니다.",
    path: ["confirmPassword"],
  });

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export function ProfileClient() {
  const { data: session, update } = useSession();
  const [imageUrl, setImageUrl] = useState(session?.user?.image || "");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const { toast } = useToast();

  // 로딩 상태 관리
  const [isProfileUpdating, setIsProfileUpdating] = useState(false);
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (session?.user) {
      profileForm.reset({
        name: session.user.name || "",
        email: session.user.email || "",
      });
      setImageUrl(session.user.image || "");
    }
  }, [session, profileForm]);

  async function onProfileSubmit(data: ProfileFormValues) {
    setIsProfileUpdating(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("프로필 업데이트에 실패했습니다.");

      await update();
      toast({
        description: "프로필이 성공적으로 업데이트되었습니다.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        description: "프로필 업데이트 중 오류가 발생했습니다.",
      });
    } finally {
      setIsProfileUpdating(false);
    }
  }

  async function handleDeleteAccount() {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("계정 삭제에 실패했습니다.");

      toast({
        description: "계정이 성공적으로 삭제되었습니다.",
      });

      // 로그아웃 처리
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      toast({
        variant: "destructive",
        description: "계정 삭제 중 오류가 발생했습니다.",
      });
      setIsDeleting(false);
    }
  }

  async function onPasswordSubmit(data: PasswordFormValues) {
    setIsPasswordUpdating(true);
    try {
      const response = await fetch("/api/user/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("비밀번호 변경에 실패했습니다.");

      passwordForm.reset();
      setIsPasswordDialogOpen(false);
      toast({
        description: "비밀번호가 성공적으로 변경되었습니다.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        description: "비밀번호 변경 중 오류가 발생했습니다.",
      });
    } finally {
      setIsPasswordUpdating(false);
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImageUploading(true);
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;

        const response = await fetch("/api/user/profile/image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image: base64String }),
        });

        if (!response.ok) throw new Error("이미지 업로드에 실패했습니다.");

        const data = await response.json();
        setImageUrl(data.image);
        await update();

        toast({
          description: "프로필 이미지가 업데이트되었습니다.",
        });
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      toast({
        variant: "destructive",
        description: "이미지 업로드 중 오류가 발생했습니다.",
      });
    } finally {
      setIsImageUploading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 flex justify-center items-start pt-10">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>프로필</CardTitle>
            <CardDescription>
              프로필 정보를 확인하고 수정할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4 mb-6">
              <div className="relative">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={imageUrl} />
                  <AvatarFallback className="text-2xl">
                    {session?.user?.name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="imageUpload"
                  className="absolute bottom-0 right-0 p-2 bg-primary rounded-full cursor-pointer hover:bg-primary/90 disabled:opacity-50"
                >
                  {isImageUploading ? (
                    <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" />
                  ) : (
                    <ImagePlus className="h-4 w-4 text-primary-foreground" />
                  )}
                </label>
                <input
                  id="imageUpload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={isImageUploading}
                />
              </div>
            </div>
            <Form {...profileForm}>
              <form
                onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={profileForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>이름</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isProfileUpdating} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>이메일</FormLabel>
                      <FormControl>
                        <Input {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Dialog
                    open={isPasswordDialogOpen}
                    onOpenChange={setIsPasswordDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isProfileUpdating}
                      >
                        <Lock className="mr-2 h-4 w-4" />
                        비밀번호 변경
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>비밀번호 변경</DialogTitle>
                        <DialogDescription>
                          새로운 비밀번호를 입력해주세요.
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...passwordForm}>
                        <form
                          onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                          className="space-y-4"
                        >
                          <FormField
                            control={passwordForm.control}
                            name="currentPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>현재 비밀번호</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    {...field}
                                    disabled={isPasswordUpdating}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={passwordForm.control}
                            name="newPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>새 비밀번호</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    {...field}
                                    disabled={isPasswordUpdating}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={passwordForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>새 비밀번호 확인</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    {...field}
                                    disabled={isPasswordUpdating}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end">
                            <Button type="submit" disabled={isPasswordUpdating}>
                              {isPasswordUpdating ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  변경 중...
                                </>
                              ) : (
                                "변경하기"
                              )}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                  <Button type="submit" disabled={isProfileUpdating}>
                    {isProfileUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        저장 중...
                      </>
                    ) : (
                      "변경사항 저장"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
            <div className="mt-8 pt-8 border-t">
              <h3 className="text-lg font-semibold text-red-600 mb-4">
                위험 구역
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다. 이 작업은
                되돌릴 수 없습니다.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    disabled={
                      isDeleting || isProfileUpdating || isPasswordUpdating
                    }
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        삭제 중...
                      </>
                    ) : (
                      "계정 삭제"
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      정말로 계정을 삭제하시겠습니까?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      이 작업은 되돌릴 수 없습니다. 모든 데이터가 영구적으로
                      삭제되며 더 이상 계정에 액세스할 수 없게 됩니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                      취소
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          삭제 중...
                        </>
                      ) : (
                        "계정 삭제"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
