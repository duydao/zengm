import classNames from "classnames";
import { useCallback, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import ResponsiveTableWrapper from "./ResponsiveTableWrapper";
import useClickable from "../hooks/useClickable";
import type { StickyCols } from "./DataTable";
import useStickyXX from "./DataTable/useStickyXX";
import {
	DndContext,
	useDroppable,
	useDraggable,
	DragOverlay,
	useSensors,
	useSensor,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
} from "@dnd-kit/core";
import {
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
	sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

type HighlightHandle<Value> = (a: { index: number; value: Value }) => boolean;
type RowClassName<Value> = (a: {
	index: number;
	isDragged: boolean;
	value: Value;
}) => string | undefined;
type Row<Value> = (a: { index: number; value: Value }) => ReactNode;

// Should be Value passed through as generic parameter, but that is annoying with HOC
type ShouldBeValue = any;

const Row = ({
	className,
	disabled2,
	highlight,
	i,
	isDragged,
	row,
	rowLabel,
	selected,
	value,
}: {
	className?: string;
	disabled2?: boolean;
	highlight: boolean;
	i: number;
	isDragged: boolean;
	selected: boolean;
	row: Row<ShouldBeValue>;
	rowLabel?: string;
	value: ShouldBeValue;
}) => {
	const { clicked, toggleClicked } = useClickable();

	const {
		attributes,
		listeners,
		setNodeRef,
		setActivatorNodeRef,
		transform,
		transition,
	} = useSortable({ id: i });

	const style = transform
		? {
				transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
				transition,
			}
		: undefined;

	return (
		<tr
			className={classNames(className, {
				"table-warning": clicked,
			})}
			onClick={toggleClicked}
			ref={setNodeRef}
			style={style}
		>
			{rowLabel !== undefined ? (
				<td className="text-center">{rowLabel}</td>
			) : null}
			{disabled2 ? (
				<td className="p-0" />
			) : (
				<td
					className={classNames("roster-handle p-0", {
						"table-info": !selected && highlight,
						"table-secondary": !selected && !highlight,
						"user-select-none": isDragged,
						"bg-primary": selected,
					})}
				>
					<a
						className={classNames("d-block w-100")}
						data-movable-handle
						style={{
							cursor: isDragged ? "grabbing" : "grab",
							height: 27,
						}}
						ref={setActivatorNodeRef}
						{...listeners}
						{...attributes}
					/>
				</td>
			)}
			{row({
				index: i,
				value,
			})}
		</tr>
	);
};

const SortableTable = <Value extends Record<string, unknown>>({
	cols,
	disabled,
	highlightHandle,
	onChange,
	onSwap,
	row,
	rowClassName,
	rowLabels,
	stickyCols = 0,
	values,
}: {
	cols: () => ReactNode;
	disabled?: boolean;
	highlightHandle: HighlightHandle<Value>;
	onChange: (a: { oldIndex: number; newIndex: number }) => void;
	onSwap: (index1: number, index2: number) => void;
	row: Row<Value>;
	rowClassName?: RowClassName<Value>;
	rowLabels?: string[];
	stickyCols?: StickyCols;
	values: Value[];
}) => {
	const [activeId, setActiveId] = useState<any>(undefined);
	const [indexSelected, setIndexSelected] = useState<number | undefined>(
		undefined,
	);

	const { stickyClass, tableRef } = useStickyXX(stickyCols);

	// Hacky shit to try to determine click from drag. Could just be a boolean, except on mobile seems sorting fires twice in a row, so we need to track the time to debounce.
	const clicked = useRef<{
		index: number | undefined;
		time: number; // Milliseconds
	}>({
		index: undefined,
		time: 0,
	});

	/*const onSortStart = useCallback(
		({ node, index }: { node: Element; index: number }) => {
			setIsDragged(true);

			// Hack to avoid responding to duiplicated event on mobile
			const ignoreToDebounce = Date.now() - clicked.current.time < 500;
			if (!ignoreToDebounce) {
				clicked.current.index = index;
			}

			// https://github.com/clauderic/react-sortable-hoc/issues/361#issuecomment-471907612
			const tds =
				document.getElementsByClassName("SortableHelper")[0].childNodes;
			for (let i = 0; i < tds.length; i++) {
				const childNode = node.childNodes[i];
				// @ts-expect-error
				tds[i].style.width = `${childNode.offsetWidth}px`;
				// @ts-expect-error
				tds[i].style.padding = "4px";
			}
		},
		[],
	);

	const onSortOver = useCallback(() => {
		clicked.current.index = undefined;
	}, []);

	const onSortEnd = useCallback(
		({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }) => {
			setIsDragged(false);

			// Hack to avoid responding to duiplicated event on mobile
			const ignoreToDebounce = Date.now() - clicked.current.time < 500;
			if (ignoreToDebounce) {
				return;
			}
			clicked.current.time = Date.now();

			if (oldIndex === newIndex && clicked.current.index === newIndex) {
				if (indexSelected === undefined) {
					setIndexSelected(newIndex);
				} else if (indexSelected === newIndex) {
					// Hack to avoid responding to duiplicated event on mobile
					if (!ignoreToDebounce) {
						setIndexSelected(undefined);
					}
				} else {
					onSwap(indexSelected, newIndex);
					setIndexSelected(undefined);
				}
			} else {
				onChange({ oldIndex, newIndex });
				setIndexSelected(undefined);
			}
			clicked.current.index = undefined;
		},
		[onChange, onSwap, indexSelected],
	);*/

	let tableClasses =
		"table table-striped table-borderless table-sm table-hover";
	if (stickyClass) {
		tableClasses += ` ${stickyClass}`;
	}

	const isDragged = activeId !== undefined;

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	return (
		<DndContext
			onDragStart={event => {
				console.log("onDragStart", event);
				setActiveId(event.active.id);
			}}
			onDragMove={event => {
				// console.log("onDragMove", event);
			}}
			onDragOver={event => {
				// console.log("onDragOver", event);
			}}
			onDragEnd={event => {
				setActiveId(undefined);
				console.log("onDragEnd", event);
				console.log(event.active.id, event.over?.id);
				const oldIndex = event.active.id;
				const newIndex = event.over?.id;
				if (newIndex !== undefined) {
					onChange({ oldIndex, newIndex });
				}
			}}
			onDragCancel={() => console.log("onDragCancel")}
			collisionDetection={closestCenter}
		>
			<SortableContext items={values.map((value, i) => i)}>
				<ResponsiveTableWrapper nonfluid>
					<table ref={tableRef} className={tableClasses}>
						<thead>
							<tr>
								<th className="p-0" />
								{rowLabels ? <th className="p-0" /> : null}
								{cols()}
							</tr>
						</thead>
						<tbody>
							{values.map((value, index) => {
								const className: string | undefined = rowClassName
									? rowClassName({ index, isDragged, value })
									: undefined;
								const highlight = highlightHandle({ index, value });

								// Hacky! Would be better to pass in explicitly. If `index` is just used, then it breaks highlighting (highlight doesn't move with row when dragged)
								let key: any;
								if (Object.hasOwn(value, "pid")) {
									key = value.pid;
								} else if (Object.hasOwn(value, "tid")) {
									key = value.tid;
								} else {
									key = index;
								}

								return (
									<Row
										className={className}
										disabled2={disabled}
										key={key}
										highlight={highlight}
										i={index}
										isDragged={isDragged}
										selected={indexSelected === index}
										rowLabel={rowLabels ? rowLabels[index] ?? "" : undefined}
										row={row}
										value={value}
									/>
								);
							})}
						</tbody>
						<DragOverlay wrapperElement="tbody">
							{activeId ? (
								<Row
									highlight={false}
									i={activeId}
									index={activeId}
									isDragged={isDragged}
									row={row}
									value={values[activeId]}
								/>
							) : null}
						</DragOverlay>
					</table>
				</ResponsiveTableWrapper>
			</SortableContext>
		</DndContext>
	);
};

export default SortableTable;
