'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Challenge {
  id: string;
  domain_key: string;
  domain_en: string;
  area_key: string;
  area_en: string;
  challenge_key: string;
  challenge_en: string;
  issues?: string;
  tags?: string;
}

interface CategoryPath {
  level1: { key: string; label: string } | null;
  level2: { key: string; label: string } | null;
  level3: { key: string; label: string } | null;
  level4: { key: string; label: string } | null;
}

interface MultiLevelCategorySelectorProps {
  value: CategoryPath;
  onChange: (path: CategoryPath) => void;
  language?: string;
  disabled?: boolean;
}

export default function MultiLevelCategorySelector({
  value,
  onChange,
  language = 'en',
  disabled = false
}: MultiLevelCategorySelectorProps) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get unique domains (Level 1)
  const domains = Array.from(
    new Set(challenges.map(c => ({ key: c.domain_key, label: c.domain_en })))
  ).sort((a, b) => a.label.localeCompare(b.label));

  // Get areas for selected domain (Level 2)
  const areas = value.level1
    ? Array.from(
        new Set(
          challenges
            .filter(c => c.domain_key === value.level1.key)
            .map(c => ({ key: c.area_key, label: c.area_en }))
        )
      ).sort((a, b) => a.label.localeCompare(b.label))
    : [];

  // Get challenges for selected area (Level 3)
  const challengeOptions = value.level1 && value.level2
    ? challenges
        .filter(
          c =>
            c.domain_key === value.level1.key &&
            c.area_key === value.level2.key
        )
        .map(c => ({ key: c.challenge_key, label: c.challenge_en }))
        .sort((a, b) => a.label.localeCompare(b.label))
    : [];

  // Get issues/tags for selected challenge (Level 4)
  const level4Options = value.level1 && value.level2 && value.level3
    ? (() => {
        const selectedChallenge = challenges.find(
          c =>
            c.domain_key === value.level1.key &&
            c.area_key === value.level2.key &&
            c.challenge_key === value.level3.key
        );
        if (selectedChallenge?.issues) {
          try {
            const issues = JSON.parse(selectedChallenge.issues);
            return Array.isArray(issues) ? issues : [selectedChallenge.issues];
          } catch {
            return selectedChallenge.issues.split(',').map(i => i.trim());
          }
        }
        if (selectedChallenge?.tags) {
          try {
            const tags = JSON.parse(selectedChallenge.tags);
            return Array.isArray(tags) ? tags : [selectedChallenge.tags];
          } catch {
            return selectedChallenge.tags.split(',').map(t => t.trim());
          }
        }
        return [];
      })()
    : [];

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('challenges')
          .select('*')
          .eq('is_active', true)
          .order('display_order');

        if (fetchError) throw fetchError;

        setChallenges(data || []);
      } catch (err) {
        console.error('Error fetching challenges:', err);
        setError('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, []);

  const handleLevelChange = (
    level: 1 | 2 | 3 | 4,
    key: string,
    label: string
  ) => {
    const newPath: CategoryPath = { ...value };

    if (level === 1) {
      newPath.level1 = { key, label };
      newPath.level2 = null;
      newPath.level3 = null;
      newPath.level4 = null;
    } else if (level === 2) {
      newPath.level2 = { key, label };
      newPath.level3 = null;
      newPath.level4 = null;
    } else if (level === 3) {
      newPath.level3 = { key, label };
      newPath.level4 = null;
    } else if (level === 4) {
      newPath.level4 = { key, label };
    }

    onChange(newPath);
  };

  if (loading) {
    return (
      <div className="text-sm text-gray-500">Loading categories...</div>
    );
  }

  if (error) {
    return <div className="text-sm text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Level 1: Domain */}
      <div>
        <label className="block text-sm font-bold text-[#0B4422] mb-2">
          Level 1: Domain *
        </label>
        <select
          value={value.level1?.key || ''}
          onChange={e => {
            const selected = domains.find(d => d.key === e.target.value);
            if (selected) {
              handleLevelChange(1, selected.key, selected.label);
            }
          }}
          required
          disabled={disabled}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base outline-none transition-all focus:border-[#0B4422] focus:ring-4 focus:ring-[#0B4422]/20 appearance-none bg-white"
        >
          <option value="">Select Domain</option>
          {domains.map(domain => (
            <option key={domain.key} value={domain.key}>
              {domain.label}
            </option>
          ))}
        </select>
      </div>

      {/* Level 2: Area of Challenge */}
      {value.level1 && (
        <div>
          <label className="block text-sm font-bold text-[#0B4422] mb-2">
            Level 2: Area of Challenge *
          </label>
          <select
            value={value.level2?.key || ''}
            onChange={e => {
              const selected = areas.find(a => a.key === e.target.value);
              if (selected) {
                handleLevelChange(2, selected.key, selected.label);
              }
            }}
            required
            disabled={disabled}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base outline-none transition-all focus:border-[#0B4422] focus:ring-4 focus:ring-[#0B4422]/20 appearance-none bg-white"
          >
            <option value="">Select Area of Challenge</option>
            {areas.map(area => (
              <option key={area.key} value={area.key}>
                {area.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Level 3: Challenge */}
      {value.level1 && value.level2 && (
        <div>
          <label className="block text-sm font-bold text-[#0B4422] mb-2">
            Level 3: Challenge *
          </label>
          <select
            value={value.level3?.key || ''}
            onChange={e => {
              const selected = challengeOptions.find(
                c => c.key === e.target.value
              );
              if (selected) {
                handleLevelChange(3, selected.key, selected.label);
              }
            }}
            required
            disabled={disabled}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base outline-none transition-all focus:border-[#0B4422] focus:ring-4 focus:ring-[#0B4422]/20 appearance-none bg-white"
          >
            <option value="">Select Challenge</option>
            {challengeOptions.map(challenge => (
              <option key={challenge.key} value={challenge.key}>
                {challenge.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Level 4: Issue */}
      {value.level1 && value.level2 && value.level3 && (
        <div>
          <label className="block text-sm font-bold text-[#0B4422] mb-2">
            Level 4: Issue
          </label>
          {level4Options.length > 0 ? (
            <select
              value={value.level4?.key || ''}
              onChange={e => {
                const selected = level4Options.find(
                  opt => opt === e.target.value
                );
                if (selected) {
                  handleLevelChange(4, selected, selected);
                }
              }}
              disabled={disabled}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base outline-none transition-all focus:border-[#0B4422] focus:ring-4 focus:ring-[#0B4422]/20 appearance-none bg-white"
            >
              <option value="">Select Issue (Optional)</option>
              {level4Options.map((option, idx) => (
                <option key={idx} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={value.level4?.key || ''}
              onChange={e => {
                if (e.target.value) {
                  handleLevelChange(4, e.target.value, e.target.value);
                } else {
                  const newPath = { ...value };
                  newPath.level4 = null;
                  onChange(newPath);
                }
              }}
              disabled={disabled}
              placeholder="Enter specific issue (Optional)"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base outline-none transition-all focus:border-[#0B4422] focus:ring-4 focus:ring-[#0B4422]/20 bg-white"
            />
          )}
        </div>
      )}

      {/* Display Selected Path */}
      {(value.level1 || value.level2 || value.level3 || value.level4) && (
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <div className="text-sm font-semibold text-emerald-800 mb-2">
            Selected Category Path:
          </div>
          <div className="text-sm text-emerald-700">
            {[
              value.level1?.label,
              value.level2?.label,
              value.level3?.label,
              value.level4?.label
            ]
              .filter(Boolean)
              .join(' > ')}
          </div>
        </div>
      )}
    </div>
  );
}

