"use client";

import {
  BookOpen,
  Star,
  Trophy,
  Clock,
  TrendingUp,
  CheckCircle2,
  CircleDot,
  Award,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

// ============================================================
// Mock-Daten (später aus API)
// ============================================================

const stats = [
  {
    label: "Offene Aufgaben",
    value: "8",
    icon: BookOpen,
    color: "from-brand-500 to-brand-600
