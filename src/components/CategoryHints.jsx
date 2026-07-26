import {
  Palette,
  Scissors,
  Store,
  Stethoscope,
  BookOpen,
  Wrench,
  Briefcase
} from 'lucide-react';
import { getCategoryExperience } from '../config/categoryExperience';

const ICON_MAP = {
  Palette,
  Scissors,
  Store,
  Stethoscope,
  BookOpen,
  Wrench,
  Briefcase
};

const CategoryHints = ({ wsType }) => {
  const exp = getCategoryExperience(wsType) || {};
  const IconComp = ICON_MAP[exp.icon] || Briefcase;

  return (
    <div className="card-premium space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 text-accent border border-theme-border-soft">
          <IconComp className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-theme-primary tracking-tight flex items-center gap-2">
            <span>{wsType ? wsType.charAt(0).toUpperCase() + wsType.slice(1) : 'General'}</span>
            <Sparkles className="w-3.5 h-3.5 text-accent" />
          </h3>
          <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider">
            Business Experience
          </p>
        </div>
      </div>

      {exp.labels && (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(exp.labels).map(([key, label]) => (
          <div key={key} className="flex items-center justify-between p-2.5 rounded-2xl bg-theme-app dark:bg-theme-app/40 border border-theme-border-soft">
            <span className="text-xs font-medium text-theme-muted capitalize">{key}</span>
            <span className="badge-premium text-[10px]">{label}</span>
          </div>
        ))}
      </div>
      )}

      {exp.dashboardHints && (
      <div className="space-y-2">
        <h4 className="text-xs font-extrabold text-theme-primary flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-accent" />
          Dashboard Tips
        </h4>
        <ul className="space-y-1.5">
          {exp.dashboardHints.map((hint, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-theme-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
              {hint}
            </li>
          ))}
        </ul>
      </div>
      )}

      {exp.quickTips && (
      <div className="space-y-2">
        <h4 className="text-xs font-extrabold text-theme-primary flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          Quick Tips
        </h4>
        <div className="flex flex-wrap gap-2">
          {exp.quickTips.map((tip, i) => (
            <span key={i} className="badge-premium text-[10px]">{tip}</span>
          ))}
        </div>
      </div>
      )}
    </div>
  );
};

export default CategoryHints;
