import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ClassDropdown() {
  return (
    <Select>
      <SelectTrigger className="w-full max-w-80 cursor-pointer rounded-sm border border-gray-300 bg-white px-3 py-6 text-sm">
        <SelectValue placeholder="Select a class" />
      </SelectTrigger>
      <SelectContent side="bottom">
        <SelectGroup>
          <SelectLabel>Classes</SelectLabel>
          <SelectItem className="cursor-pointer py-3" value="Math">
            Math
          </SelectItem>
          <SelectItem className="cursor-pointer py-3" value="Science">
            Science
          </SelectItem>
          <SelectItem className="cursor-pointer py-3" value="History">
            History
          </SelectItem>
          <SelectItem className="cursor-pointer py-3" value="English">
            English
          </SelectItem>
          <SelectItem className="cursor-pointer py-3" value="Art">
            Art
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
