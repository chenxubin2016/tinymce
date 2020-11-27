import { Universe } from '@ephox/boss';
import { Fun, Maybe, Maybes } from '@ephox/katamari';
import { Gather, Traverse } from '@ephox/phoenix';
import { ZonePosition } from '../api/general/ZonePosition';
import { ZoneViewports } from '../api/general/ZoneViewports';
import { WordDecisionItem } from '../words/WordDecision';
import { LanguageZones, ZoneDetails } from './LanguageZones';

// Figure out which direction to take the next step in. Returns None if the traversal should stop.
const getNextStep = <E, D>(
  universe: Universe<E, D>,
  viewport: ZoneViewports<E>,
  traverse: Traverse<E>
): Maybe<Traverse<E>> => {
  if (!universe.property().isBoundary(traverse.item)) {
    return Maybes.just(traverse);
  } else {
    // We are in a boundary, take the time to check where we are relative to the viewport
    return ZonePosition.cata(viewport.assess(traverse.item),
      () => {
        // We are above the viewport, so skip
        // Only sidestep if we haven't already tried it. Otherwise, we'll loop forever.
        if (traverse.mode !== Gather.backtrack) {
          return Maybes.just({ item: traverse.item, mode: Gather.sidestep });
        } else {
          return Maybes.nothing;
        }
      },
      () => Maybes.just(traverse), // We are inside the viewport, continue walking normally
      () => Maybes.nothing // We've gone past the end of the viewport, so stop completely
    );
  }
};

// Visit a position, and make a corresponding entry on the stack.
const visit = <E, D>(
  universe: Universe<E, D>,
  stack: LanguageZones<E>,
  transform: (universe: Universe<E, D>, item: E) => WordDecisionItem<E>,
  viewport: ZoneViewports<E>,
  traverse: Traverse<E>
): void => {
  // Find if the current item has a lang property on it.
  const currentLang: Maybe<string> = universe.property().isElement(traverse.item) ?
    Maybes.from(universe.attrs().get(traverse.item, 'lang')) :
    Maybes.nothing;

  if (universe.property().isText(traverse.item)) {
    stack.addDetail(transform(universe, traverse.item));
  } else if (universe.property().isBoundary(traverse.item)) {
    // Only visit this item if we are inside the viewport
    ZonePosition.cata(viewport.assess(traverse.item),
      Fun.noop, // Do nothing when above the viewport
      () => {
        // We are in the viewport, so process normally
        if (traverse.mode === Gather.advance) {
          stack.openBoundary(currentLang, traverse.item);
        } else {
          stack.closeBoundary(currentLang, traverse.item);
        }
        return Maybes.just(traverse);
      },
      Fun.noop // Do nothing when below the viewport
    );
  } else if (universe.property().isEmptyTag(traverse.item)) {
    stack.addEmpty(traverse.item);
  } else {
    if (traverse.mode === Gather.advance) {
      stack.openInline(currentLang, traverse.item);
    } else {
      stack.closeInline(currentLang, traverse.item);
    }
  }
};

const walk = <E, D>(
  universe: Universe<E, D>,
  start: E,
  finish: E,
  defaultLang: string,
  transform: (universe: Universe<E, D>, item: E) => WordDecisionItem<E>,
  viewport: ZoneViewports<E>
): ZoneDetails<E>[] => {
  const shouldContinue = (traverse: Traverse<E>) => {
    if (!universe.eq(traverse.item, finish)) {
      return true;
    }

    return (
      traverse.mode === Gather.advance &&
      !universe.property().isText(traverse.item) &&
      universe.property().children(traverse.item).length !== 0
    );
  };

  // INVESTIGATE: Make the language zone stack immutable *and* performant
  const stack = LanguageZones.nu<E>(defaultLang);

  let state = Fun.pipe(Maybes.just<Traverse<E>>({ item: start, mode: Gather.advance }),
    (m) => Maybes.filter(m, shouldContinue)
  );

  while (state.tag === 'JUST') {
    visit(universe, stack, transform, viewport, state.value);

    state = Fun.pipe(state,
      (m) => Maybes.bind(m, (state) => getNextStep(universe, viewport, state)),
      (m) => Maybes.bindO(m, (traverse) => Gather.walk(universe, traverse.item, traverse.mode, Gather.walkers().right())),
      (m) => Maybes.filter(m, shouldContinue),
    );
  }

  if (universe.property().isText(finish)) {
    stack.addDetail(transform(universe, finish));
  }

  return stack.done();
};

export {
  walk
};
