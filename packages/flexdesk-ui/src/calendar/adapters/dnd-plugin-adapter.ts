import { createDragAndDropPlugin } from '@schedule-x/drag-and-drop';

/**
 * Compatibility adapter for the @schedule-x/drag-and-drop v3 plugin
 * to work with @schedule-x/calendar v4.
 *
 * In v4, the calendar core calls startTimeGridDrag / startDateGridDrag / startMonthGridDrag
 * but the free v3 plugin provides createTimeGridDragHandler / createDateGridDragHandler / createMonthGridDragHandler.
 * This adapter adds the v4 method names as aliases.
 */
export function createDragAndDropPluginCompat(minutesPerInterval = 15) {
  const plugin = createDragAndDropPlugin(minutesPerInterval) as any;

  // Add v4 method aliases that delegate to the v3 methods
  plugin.startTimeGridDrag = plugin.createTimeGridDragHandler.bind(plugin);
  plugin.startDateGridDrag = plugin.createDateGridDragHandler.bind(plugin);
  plugin.startMonthGridDrag = plugin.createMonthGridDragHandler.bind(plugin);

  return plugin;
}
