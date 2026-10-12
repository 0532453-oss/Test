import React from "react";
import { Plus } from "lucide-react";
import { Translate, useCreatePath, useResourceContext } from "ra-core";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";

export type CreateButtonProps = {
  label?: string;
  resource?: string;
};

/**
 * A button that navigates to the create page for a resource.
 *
 * @example
 * import { CreateButton, List, ExportButton } from '@/components/admin';
 *
 * const PostList = () => (
 *   <List
 *     actions={<>
 *       <CreateButton />
 *       <ExportButton />
 *     </>}
 *   >
 *     ...
 *   </List>
 * );
 */
export const CreateButton = ({
  label,
  resource: targetResource,
}: CreateButtonProps) => {
  const resource = useResourceContext();
  const createPath = useCreatePath();
  const link = createPath({
    resource: targetResource ?? resource,
    type: "create",
  });
  return (
    <Button variant="outline" size="sm" asChild>
      <Link to={link} onClick={stopPropagation}>
        <Plus className="h-4 w-4" />
        <Translate i18nKey={label ?? "ra.action.create"}>
          {label ?? "Create"}
        </Translate>
      </Link>
    </Button>
  );
};

// useful to prevent click bubbling in a datagrid with rowClick
const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();
