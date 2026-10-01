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
  // 整页只从 currentTree 这一个快照取数：标题、节点、展柜天然同源，
  // 切换假设时不会出现旧树路径短暂混入新树的中间态。
  renderTreeApp(
    rootEl,
    currentTree,
    isCabinetOpen,
    PRESETS,
    {
      onGrowNewTree: (assumption: string) => {
        const trimmed = assumption.trim();
        if (!trimmed) return;

        // 先在新对象上完整构建，构建成功后才一次性提交到 currentTree；
        // 一旦构建抛错（空假设 / 引擎失败），直接保留原树，不做任何半切换渲染。
        let nextTree: CounterfactualTree;
        try {
          nextTree = treeAdapter.createTree(trimmed);
        } catch (err) {
          alert(err instanceof Error ? err.message : '反事实树生长失败，已为你保留当前时空谱系。');
          return;
        }

        currentTree = nextTree;
        refreshView();
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
        // 树内展柜与持久化档案同步移除，避免两个数据源分叉。
        specimenAdapter.remove(id);
        currentTree = treeAdapter.removeSpecimen(currentTree, id);
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
