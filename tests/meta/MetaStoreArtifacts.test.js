import MetaStore from '../../js/meta/MetaStore.js';

describe('MetaStore artifacts', () => {
    test('prepareArtifactsForRun preserves duplicates and order', () => {
        const store = new MetaStore('meta_artifacts_test_prepare');
        store.data.artifacts.stash = ['a', 'a', 'b', 'c'];
        store.data.artifacts.inRun = [];

        const selected = store.prepareArtifactsForRun(2);

        expect(selected).toEqual(['a', 'a']);
        expect(store.data.artifacts.inRun).toEqual(['a', 'a']);
        expect(store.data.artifacts.stash).toEqual(['b', 'c']);
    });

    test('completeRunArtifacts appends on success', () => {
        const store = new MetaStore('meta_artifacts_test_complete');
        store.data.artifacts.stash = ['a'];

        store.completeRunArtifacts(['a', 'b'], true);

        expect(store.data.artifacts.stash).toEqual(['a', 'a', 'b']);
        expect(store.data.artifacts.inRun).toEqual([]);
    });
});
