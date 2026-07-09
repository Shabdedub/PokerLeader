import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PerformanceChart } from '../components/charts/PerformanceChart';
import { EmptyState } from '../components/EmptyState';
import { Header } from '../components/Header';
import { SegmentedControl } from '../components/SegmentedControl';
import { performanceSeries } from '../lib/stats';
import { useStore } from '../store/useStore';
import { colors, sp, type } from '../theme';

export function PerformanceScreen() {
  const players = useStore((s) => s.players);
  const games = useStore((s) => s.games);
  const [mode, setMode] = useState<'perGame' | 'cumulative'>('perGame');

  const series = useMemo(() => performanceSeries(players, games, mode), [players, games, mode]);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <Header title="Performance" subtitle="Everyone, game by game" />

      {series.length === 0 ? (
        <EmptyState
          glyph="📈"
          title="Nothing to plot yet"
          message="Finish a game and every player gets a line here — their card colour, their results, side by side."
        />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: sp(10) }}>
          <View style={{ paddingHorizontal: sp(5), marginBottom: sp(4) }}>
            <SegmentedControl
              options={[
                { key: 'perGame', label: 'Per game' },
                { key: 'cumulative', label: 'Cumulative' },
              ]}
              value={mode}
              onChange={setMode}
            />
          </View>

          <View style={{ paddingHorizontal: sp(5) }}>
            <PerformanceChart series={series} games={games} mode={mode} />
          </View>

          <Text style={[type.caption, styles.hint]}>
            {mode === 'perGame'
              ? 'Each point is that game’s net result. Tap a point for the full table.'
              : 'Running totals across every game. Tap a point for the standings that night.'}
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  hint: {
    textAlign: 'center',
    marginTop: sp(3),
    paddingHorizontal: sp(8),
  },
});
