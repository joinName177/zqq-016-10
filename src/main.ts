import './ui/styles.css';
import { TreeEngineAdapter } from './adapters/tree-engine.adapter';
import { LocalSpecimenAdapter } from './adapters/local-specimen.adapter';
import { CounterfactualTree } from './core/models';
import { renderTreeApp } from './ui/app';

const treeAdapter = new TreeEngineAdapter();
const specimenAdapter = new LocalSpecimenAdapter();

const PRESETS = [
  '如果当初我留在了故乡小城',
  '如果当初我鼓起勇气向TA表白了心意',
  '如果当年我选择了读纯艺术专业',
  '如果当年我没有接受那家大厂的Offer'
];

let currentTree: CounterfactualTree = treeAdapter.createTree(PRESETS[0]);
let isCabinetOpen = false;

const rootEl = document.getElementById('app')!;

function refreshView() {
  // 展柜仅陈列与当前树同一假设下采集的标本，
  // 保证标题、节点与展柜始终来自同一棵树（其余假设的标本仍保留在存储中）
  const specimens = specimenAdapter
    .getAll()
    .filter(s => s.assumption === currentTree.assumption);

  renderTreeApp(
    rootEl,
    currentTree,
    specimens,
    isCabinetOpen,
    PRESETS,
    {
      onGrowNewTree: (assumption: string) => {
        try {
          // 先完整生长新树，成功后再提交切换；失败则保留原树
          const nextTree = treeAdapter.createTree(assumption);
          currentTree = nextTree;
          refreshView();
        } catch (err) {
          console.error('生长反事实树失败，已保留原树：', err);
          refreshView();
          alert('新假设演化失败，已保留当前反事实树。');
        }
      },
      onWaterNode: (nodeId: string) => {
        currentTree = treeAdapter.water(currentTree, nodeId);
        refreshView();
      },
      onPruneNode: (nodeId: string) => {
        currentTree = treeAdapter.prune(currentTree, nodeId);
        refreshView();
      },
      onHarvestNode: (nodeId: string) => {
        const sp = treeAdapter.harvest(currentTree, nodeId);
        specimenAdapter.save(sp);
        alert(`已成功将节点【${sp.title}】收入平行人生标本馆！`);
        refreshView();
      },
      onDeleteSpecimen: (id: string) => {
        specimenAdapter.remove(id);
        refreshView();
      },
      onToggleCabinet: (open: boolean) => {
        isCabinetOpen = open;
        refreshView();
      }
    }
  );
}

// Initial render
refreshView();
