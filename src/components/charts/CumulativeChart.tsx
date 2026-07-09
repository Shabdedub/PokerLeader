import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { fmtNet, netColor } from '../../lib/money';
import { fmtDate, PlayerGameResult } from '../../lib/stats';
import { alpha, colors, radius, sp } from '../../theme';
import { Player } from '../../types';
import { axisText, fmtAxisMoney, niceRange, sparseLabels } from './chartTheme';

interface Props {
  player: Player;
  results: PlayerGameResult[];
}

/**
 * One player's cumulative net profit across their games — a single series in
 * the player's own colour with a soft area fill and tap-for-tooltip pointer.
 */
export function CumulativeChart({ player, results }: Props) {
  const [width, setWidth] = useState(0);

  const values = results.map((r) => r.cumulative);
  const range = niceRange(values);
  const labels = sparseLabels(results.map((r) => fmtDate(r.date)));

  const data = results.map((r, i) => ({
    value: r.cumulative,
    label: labels[i],
    labelTextStyle: { ...axisText, width: 46 },
  }));

  const yAxisWidth = 44;
  const initialSpacing = 14;
  const plotWidth = Math.max(0, width - yAxisWidth - initialSpacing - 16);
  const spacing = results.length > 1 ? Math.max(24, plotWidth / (results.length - 1)) : plotWidth;

  return (
    <View style={styles.card} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <LineChart
          data={data}
          width={plotWidth + initialSpacing}
          height={190}
          spacing={spacing}
          initialSpacing={initialSpacing}
          endSpacing={8}
          thickness={2}
          color={player.color}
          areaChart
          startFillColor={alpha(player.color, 0.28)}
          endFillColor={alpha(player.color, 0.02)}
          startOpacity={1}
          endOpacity={1}
          dataPointsColor={player.color}
          dataPointsRadius={4}
          hideDataPoints={results.length > 14}
          isAnimated
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
            pointerColor: player.color,
            radius: 5,
            pointerStripColor: colors.borderStrong,
            pointerStripWidth: 1,
            pointerStripUptoDataPoint: false,
            autoAdjustPointerLabelPosition: true,
            pointerLabelWidth: 150,
            pointerLabelHeight: 70,
            pointerVanishDelay: 2200,
            pointerLabelComponent: (items: { value: number }[], _sec: unknown, pointerIndex: number) => {
              const r = results[pointerIndex];
              if (!r) return null;
              return (
                <View style={styles.tooltip}>
                  <Text style={styles.tooltipDate}>{fmtDate(r.date)}</Text>
                  <Text style={styles.tooltipRow}>
                    Game <Text style={{ color: netColor(r.net), fontWeight: '800' }}>{fmtNet(r.net)}</Text>
                  </Text>
                  <Text style={styles.tooltipRow}>
                    Total <Text style={{ color: netColor(r.cumulative), fontWeight: '800' }}>{fmtNet(r.cumulative)}</Text>
                  </Text>
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
  tooltip: {
    backgroundColor: colors.surface3,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 10,
    width: 150,
  },
  tooltipDate: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 3,
  },
  tooltipRow: {
    color: colors.textSecondary,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    marginTop: 1,
  },
});
