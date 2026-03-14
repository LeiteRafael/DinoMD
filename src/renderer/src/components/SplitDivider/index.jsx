import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'
import styles from './SplitDivider.module.css'

/**
 * SplitDivider — horizontal two-panel layout with a draggable resize handle.
 *
 * Props:
 *   left  — ReactNode rendered in the left panel
 *   right — ReactNode rendered in the right panel
 */
export default function SplitDivider({ left, right }) {
  return (
    <PanelGroup direction="horizontal" className={styles.group}>
      <Panel minSize={20} className={styles.panel}>
        {left}
      </Panel>
      <PanelResizeHandle className={styles.handle} />
      <Panel minSize={20} className={styles.panel}>
        {right}
      </Panel>
    </PanelGroup>
  )
}
