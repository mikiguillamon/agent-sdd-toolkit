import { OperationJournal } from './transaction.js';

export async function withRollback(reporter, options, work) {
  const transaction = new OperationJournal();
  const scopedOptions = { ...options, transaction };

  try {
    return await work(scopedOptions, transaction);
  } catch (error) {
    reporter.warn(
      'command failed; attempting cleanup of toolkit-owned changes'
    );
    const cleanup = await transaction.rollback();

    if (cleanup.ok && !cleanup.partial) {
      reporter.ok('cleanup completed for toolkit-owned changes');
    } else {
      reporter.warn(
        'cleanup completed partially; some external side effects may remain'
      );
    }

    for (const failure of cleanup.failures) {
      reporter.warn(
        `cleanup could not restore ${failure.path}: ${failure.reason}`
      );
    }

    for (const note of cleanup.externalNotes) {
      reporter.warn(note);
    }

    throw error;
  } finally {
    await transaction.dispose();
  }
}
