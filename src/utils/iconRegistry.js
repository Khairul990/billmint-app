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
  ShoppingBag, ShoppingCart, Stethoscope, Store, Tool, Truck, User, UserPlus,
  Users, Wrench, Zap
} from 'lucide-react';

const iconRegistry = {
  BookOpen, Briefcase, Building, CreditCard, DollarSign, FileText, Folder,
  GraduationCap, HeartPulse, HelpCircle, Link, MessageCircle, MessageCircleQuestion,
  Package, Palette, PlayCircle, Rocket, Scissors, Settings, Shield, Shirt,
  ShoppingBag, ShoppingCart, Stethoscope, Store, Tool, Truck, User, UserPlus,
  Users, Wrench, Zap
};

export default iconRegistry;
