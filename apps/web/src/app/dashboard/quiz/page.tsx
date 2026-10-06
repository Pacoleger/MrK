"use client";

import * as React from "react";
import Link from "next/link";
import {
  Plus,
  Loader2,
  Inbox,
  ListChecks,
  Play,
  CheckCircle2,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuizCreatorDialog } from "@/components/quiz/quiz-creator-dialog";
import { quizzesApi } from "@/lib/quizzes-api";
import { classesApi, type ClassInfo } from "@/lib/stats-api";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Quiz } from "@/lib/quiz-types";

export default function QuizListPage() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = React.useState<Quiz[]>(
