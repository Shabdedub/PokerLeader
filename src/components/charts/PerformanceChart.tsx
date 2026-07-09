import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { fmtNet, netColor } from '../../lib/money';
import { fmtDateFull, gamesByDate, PlayerSeries } from '../../lib/stats';
import { colors, radius, sp } from '../../theme';
import { Game } from '../../types';
import { axisText, fmtAxisMoney, niceRange, sparseLabels } from './chartTheme';

interface Props {
  series: PlayerSeries[];
  games: Game[];
  mode: 'perGame' | 'cumulative';
}

/**
 * Everyone on one plot: one colour-coded line per player (their card colour),
 * x = games in date order, y = net result (or running total). Games a player
 * sat out have no marker; tapping a game shows who actually played it.
 */
export function PerformanceChart({ series, games, mode }: Props) {
  const [width, setWidth] = useState(0);

  const ordered = gamesByDate(games);
  const gameCount = ordered.length;

  const allValues = series.flatMap((s) => s.points.map((p) => p.value).filter((v): v is number => v !== null));
  const range = niceRange(allValues);
  const labels = sparseLabels(ordered.map((g) => fmtDateFull(g.endedAt ?? g.startedAt).replace(/ \d{4}$/, '')));

  const yAxisWidth = 44;
  const initialSpacing = 14;
  const plotWidth = Math.max(0, width - yAxisWidth - initialSpacing - 16);
  const spacing = gameCount > 1 ? Math.max(28, plotWidth / (gameCount - 1)) : plotWidth;

  const dataSet = series.map((s) => ({
    data: s.points.map((p, i) => ({
      // Missing games stay undefined: the chart bridges the line and hides the marker.
      value: p.value === null ? undefined : p.value,
      label: labels[i],
      labelTextStyle: { ...axisText, width: 52 },
    })),
    color: s.player.color,
    thickness: 2,
    dataPointsColor: s.player.color,
    dataPointsRadius: 3.5,
    hideDataPoints: gameCount > 14,
  }));

  return (
    <View style={styles.card} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {/* Legend: identity is never colour-alone — names sit beside every dot. */}
      <View style={styles.legend}>
        {series.map((s) => (
          <View key={s.player.id} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: s.player.color }]} />
            <Text style={styles.legendLabel} numberOfLines={1}>
              {s.player.name}
            </Text>
          </View>
        ))}
      </View>

      {width > 0 && (
        <LineChart
          dataSet={dataSet as never}
          width={plotWidth + initialSpacing}
          height={220}
          spacing={spacing}
          initialSpacing={initialSpacing}
          endSpacing={8}
          isAnimated
          animateTogether
          animationDuration={700}
          yAxisOffset={range.offset}
          maxValue={range.span}
          noOfSections={range.sections}
          formatYLabel={(label: string) => fmtAxisMoney(parseFloat(label))}
          yAxisTextStyle={axisText}
          yAxisLabelWidth={yAxisWidth}
          yAxisColor="transparent"
          xAxisColor={colors.axis}
          rulesColor={colors.grid}
          rulesType="solid"
          xAxisLabelTextStyle={axisText}
          pointerConfig={{
            pointerColorsForDataSet: series.map((s) => s.player.color),
            radius: 4,
            pointerStripColor: colors.borderStrong,
            pointerStripWidth: 1,
            hidePointerForMissingValues: true,
            autoAdjustPointerLabelPosition: true,
            pointerLabelWidth: 172,
            pointerVanishDelay: 2600,
            pointerLabelComponent: (_items: unknown, _sec: unknown, pointerIndex: number) => {
              const game = ordered[pointerIndex];
              if (!game) return null;
              const rows = series
                .map((s) => ({ player: s.player, point: s.points[pointerIndex] }))
                .filter((r) => (mode === 'perGame' ? r.point?.played : r.point?.value !== null))
                .sort((a, b) => (b.point.value ?? 0) - (a.point.value ?? 0));
              return (
                <View style={styles.tooltip}>
                  <Text style={styles.tooltipDate}>
                    {fmtDateFull(game.endedAt ?? game.startedAt)}
                    {mode === 'cumulative' ? ' · total so far' : ''}
                  </Text>
                  {rows.map((r) => (
                    <View key={r.player.id} style={styles.tooltipRow}>
                      <View style={[styles.legendDot, { backgroundColor: r.player.color }]} />
                      <Text style={styles.tooltipName} numberOfLines={1}>
                        {r.player.name}
                        {mode === 'cumulative' && !r.point.played ? ' (sat out)' : ''}
                      </Text>
                      <Text style={[styles.tooltipValue, { color: netColor(r.point.value ?? 0) }]}>
                        {fmtNet(r.point.value ?? 0)}
                      </Text>
                    </View>
                  ))}
                </View>
              );
            },
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: sp(4),
    paddingHorizontal: sp(2),
    overflow: 'hidden',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sp(2),
    rowGap: sp(1.5),
    paddingHorizontal: sp(2.5),
    marginBottom: sp(3.5),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface2,
    borderRadius: radius.full,
    paddingVertical: 4,
    paddingHorizontal: 10,
    maxWidth: 140,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  legendLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  tooltip: {
    backgroundColor: colors.surface3,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 10,
    width: 172,
  },
  tooltipDate: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  tooltipName: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  tooltipValue: {
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
