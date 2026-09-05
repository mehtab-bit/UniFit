import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MealLogEntry, FoodCatalogItem } from '../../types/domain';
import { mealLogService } from '../../services';

interface MealLogSheetProps {
  visible: boolean;
  date: string;
  entry: MealLogEntry | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}

function toNumber(value: string): number | null {
  const parsed = Number(value);
  return value.trim() !== '' && Number.isFinite(parsed) ? parsed : null;
}

export const MealLogSheet: React.FC<MealLogSheetProps> = ({
  visible,
  date,
  entry,
  onClose,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fibre, setFibre] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<FoodCatalogItem[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodCatalogItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setName(entry?.custom_name || '');
    setCalories(
      entry?.nutrition.calories_kcal != null
        ? String(entry.nutrition.calories_kcal)
        : ''
    );
    setProtein(
      entry?.nutrition.protein_g != null ? String(entry.nutrition.protein_g) : ''
    );
    setCarbs(
      entry?.nutrition.carbohydrates_g != null
        ? String(entry.nutrition.carbohydrates_g)
        : ''
    );
    setFat(entry?.nutrition.fat_g != null ? String(entry.nutrition.fat_g) : '');
    setFibre(entry?.nutrition.fibre_g != null ? String(entry.nutrition.fibre_g) : '');
    setQuantity(entry ? String(entry.quantity) : '1');
    setSearch('');
    setResults([]);
    setSelectedFood(null);
    setError(null);
  }, [visible, entry]);

  const runSearch = async (query: string) => {
    setSearch(query);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    try {
      setResults(await mealLogService.searchFoods(query.trim()));
    } catch {
      setResults([]);
    }
  };

  const chooseFood = (food: FoodCatalogItem) => {
    setSelectedFood(food);
    setName(food.display_name);
    setCalories(food.energy_kcal != null ? String(food.energy_kcal) : '');
    setProtein(food.protein_g != null ? String(food.protein_g) : '');
    setCarbs(food.carbohydrate_g != null ? String(food.carbohydrate_g) : '');
    setFat(food.fat_g != null ? String(food.fat_g) : '');
    setFibre(food.fiber_g != null ? String(food.fiber_g) : '');
    setQuantity('100');
    setResults([]);
    setSearch('');
  };

  const save = async () => {
    const nutrition = {
      calories_kcal: toNumber(calories),
      protein_g: toNumber(protein),
      carbohydrates_g: toNumber(carbs),
      fat_g: toNumber(fat),
      fibre_g: toNumber(fibre),
      carbohydrate_complete: selectedFood
        ? selectedFood.carbohydrate_g != null
        : Boolean(carbs.trim()),
      fiber_complete: selectedFood
        ? selectedFood.fiber_g != null
        : Boolean(fibre.trim()),
    };
    setSaving(true);
    setError(null);
    try {
      if (entry) {
        await mealLogService.update(entry.id, {
          quantity: toNumber(quantity) ?? entry.quantity,
          quantity_unit: entry.quantity_unit || 'serving',
          custom_name: name.trim() || entry.custom_name,
          nutrition,
          source: entry.source,
          food_code: selectedFood?.food_code ?? entry.food_code,
        });
      } else {
        await mealLogService.create({
          local_date: date,
          meal_type: null,
          source: selectedFood ? 'food' : 'custom',
          food_code: selectedFood?.food_code || null,
          custom_name: name.trim() || null,
          quantity: toNumber(quantity) ?? 1,
          quantity_unit: selectedFood ? 'gram' : 'serving',
          nutrition,
        });
      }
      onClose();
      await onSaved();
    } catch {
      setError('Unable to save this entry. Please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  if (!visible) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.overlay}
    >
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{entry ? 'Edit food' : 'Log food'}</Text>
            <Text style={styles.subtitle}>{date}</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.close}>
            <Feather name="x" size={20} color="#64748B" />
          </Pressable>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Food name"
          placeholderTextColor="#94A3B8"
          style={styles.input}
        />

        <TextInput
          value={search}
          onChangeText={runSearch}
          placeholder="Search database foods (e.g. ragi)"
          placeholderTextColor="#94A3B8"
          style={styles.input}
        />
        {results.length > 0 ? (
          <ScrollView style={styles.results} keyboardShouldPersistTaps="handled">
            {results.map((food) => (
              <Pressable
                key={food.food_code}
                onPress={() => chooseFood(food)}
                style={styles.resultRow}
              >
                <Text numberOfLines={1} style={styles.resultName}>
                  {food.display_name}
                </Text>
                <Text style={styles.resultCalories}>
                  {food.energy_kcal != null ? `${Math.round(food.energy_kcal)} kcal/100g` : 'values unknown'}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.numberRow}>
          <TextInput
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            placeholder={selectedFood ? 'Grams' : 'Servings'}
            placeholderTextColor="#94A3B8"
            style={[styles.input, styles.flexHalf]}
          />
          <Text style={styles.unitHint}>
            {selectedFood ? 'grams (100g shown)' : 'serving'}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>NUTRIENTS (per logged quantity)</Text>
        <View style={styles.numberRow}>
          <TextInput value={calories} onChangeText={setCalories} keyboardType="numeric" placeholder="Calories" placeholderTextColor="#94A3B8" style={[styles.input, styles.flexHalf]} />
          <TextInput value={protein} onChangeText={setProtein} keyboardType="numeric" placeholder="Protein g" placeholderTextColor="#94A3B8" style={[styles.input, styles.flexHalf]} />
        </View>
        <View style={styles.numberRow}>
          <TextInput value={carbs} onChangeText={setCarbs} keyboardType="numeric" placeholder="Carbs g" placeholderTextColor="#94A3B8" style={[styles.input, styles.flexHalf]} />
          <TextInput value={fat} onChangeText={setFat} keyboardType="numeric" placeholder="Fat g" placeholderTextColor="#94A3B8" style={[styles.input, styles.flexHalf]} />
        </View>
        <TextInput value={fibre} onChangeText={setFibre} keyboardType="numeric" placeholder="Fibre g (optional)" placeholderTextColor="#94A3B8" style={styles.input} />

        <View style={styles.actions}>
          <Pressable onPress={onClose} style={styles.cancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable onPress={save} disabled={saving || !name.trim()} style={[styles.save, !name.trim() && styles.saveDisabled]}>
            <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save'}</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    padding: 20,
    zIndex: 100,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  title: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  close: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9' },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 10,
    minHeight: 44,
  },
  results: { maxHeight: 150, marginBottom: 8 },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  resultName: { flex: 1, fontSize: 13, fontWeight: '600', color: '#0F172A', paddingRight: 8 },
  resultCalories: { fontSize: 12, color: '#64748B' },
  numberRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  flexHalf: { flex: 1 },
  unitHint: { fontSize: 12, color: '#64748B', flex: 1 },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: '#64748B', letterSpacing: 1, marginBottom: 8 },
  errorText: { color: '#DC2626', fontSize: 13, marginBottom: 10 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancel: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: '#F1F5F9' },
  cancelText: { color: '#334155', fontWeight: '700' },
  save: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: '#0EA5E9' },
  saveDisabled: { opacity: 0.5 },
  saveText: { color: '#FFFFFF', fontWeight: '800' },
});
