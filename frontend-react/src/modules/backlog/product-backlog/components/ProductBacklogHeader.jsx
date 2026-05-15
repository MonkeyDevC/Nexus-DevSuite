import Breadcrumb from "../../../../design-system/patterns/Breadcrumb/Breadcrumb.jsx";
import { PageHeader } from "../../../../design-system/patterns/PageHeader/PageHeader.jsx";

/**
 * @param {object} props
 * @param {string} props.title
 * @param {string} props.description
 * @param {{ label: string, path?: string }[]} props.breadcrumbItems
 * @param {import("react").ReactNode} [props.actions]
 */
export default function ProductBacklogHeader({ title, description, breadcrumbItems, actions }) {
  return (
    <PageHeader
      title={title}
      description={description}
      breadcrumb={
        <div data-testid="breadcrumb-product-backlog">
          <Breadcrumb items={breadcrumbItems} />
        </div>
      }
      actions={actions}
    />
  );
}
