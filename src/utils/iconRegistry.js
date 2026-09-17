/**
 * Curated lucide icon registry.
 *
 * A few pages resolve icons dynamically from a string name
 * (`Icons[name]`). Doing that with `import * as Icons from
 * 'lucide-react'` pulls the ENTIRE 1,500-icon library (~800KB) into
 * one shared chunk. This registry imports only the icons that are
 * actually addressable by name, so the rest of lucide stays
 * tree-shaken everywhere.
 */
import {
  BookOpen, Briefcase, Building, CreditCard, DollarSign, FileText, Folder,
  GraduationCap, HeartPulse, HelpCircle, Link, MessageCircle, MessageCircleQuestion,
  Package, Palette, PlayCircle, Rocket, Scissors, Settings, Shield, Shirt,
  ShoppingBag, ShoppingCart, Stethoscope, Store, Truck, User, UserPlus,
  Users, Wrench, Zap
} from 'lucide-react';

const iconRegistry = {
  BookOpen, Briefcase, Building, CreditCard, DollarSign, FileText, Folder,
  GraduationCap, HeartPulse, HelpCircle, Link, MessageCircle, MessageCircleQuestion,
  Package, Palette, PlayCircle, Rocket, Scissors, Settings, Shield, Shirt,
  ShoppingBag, ShoppingCart, Stethoscope, Store, Truck, User, UserPlus,
  Users, Wrench, Zap,
  // businessPresets returns the name "Tool" for service/repair businesses,
  // but lucide-react has no such export (it silently resolved to undefined
  // under the old barrel import). Alias it to Wrench so the lookup works.
  Tool: Wrench
};

export default iconRegistry;
