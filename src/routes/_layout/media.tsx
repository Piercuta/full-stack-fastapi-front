import {
  Badge,
  Box,
  Container,
  Flex,
  Heading,
  Image,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useRef } from "react"

import { Button } from "@/components/ui/button"
import {
  type MediaJob,
  listMediaJobs,
  uploadMedia,
} from "@/services/mediaService"

export const Route = createFileRoute("/_layout/media")({
  component: MediaPage,
})

function statusColor(status: MediaJob["status"]) {
  switch (status) {
    case "queued":
      return "yellow"
    case "processing":
      return "blue"
    case "done":
      return "green"
    case "failed":
      return "red"
    default:
      return "gray"
  }
}

function MediaPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useQuery({
    queryKey: ["media-jobs"],
    queryFn: listMediaJobs,
    refetchInterval: (query) => {
      const jobs = query.state.data?.data || []
      const pending = jobs.some(
        (job) => job.status === "queued" || job.status === "processing",
      )
      return pending ? 3000 : false
    },
  })

  const uploadMutation = useMutation({
    mutationFn: uploadMedia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-jobs"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
    },
  })

  const onPickFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      await uploadMutation.mutateAsync(file)
    } finally {
      event.target.value = ""
    }
  }

  return (
    <Container maxW="full">
      <Box pt={8} m={4}>
        <Flex justify="space-between" align="center" mb={6} gap={4} wrap="wrap">
          <Box>
            <Heading size="lg">Media</Heading>
            <Text color="fg.muted" mt={1}>
              Upload an image → SQS → media-worker builds 64/256/512 variants.
            </Text>
          </Box>
          <Box>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              style={{ display: "none" }}
              onChange={onPickFile}
            />
            <Button
              onClick={() => inputRef.current?.click()}
              loading={uploadMutation.isPending}
            >
              Upload image
            </Button>
          </Box>
        </Flex>

        {uploadMutation.isError ? (
          <Text color="red.500" mb={4}>
            {(uploadMutation.error as Error).message}
          </Text>
        ) : null}
        {isError ? (
          <Text color="red.500" mb={4}>
            Could not load media jobs.
          </Text>
        ) : null}
        {isLoading ? <Text color="fg.muted">Loading jobs…</Text> : null}

        {!isLoading && data?.data.length === 0 ? (
          <Text color="fg.muted">No media jobs yet. Upload an image to start.</Text>
        ) : null}

        <VStack align="stretch" gap={4}>
          {data?.data.map((job) => (
            <Box
              key={job.id}
              borderWidth="1px"
              borderColor="border"
              borderRadius="md"
              p={4}
            >
              <Flex justify="space-between" gap={4} wrap="wrap" mb={3}>
                <Box>
                  <Text fontWeight="medium">Job {job.id.slice(0, 8)}…</Text>
                  <Text fontSize="sm" color="fg.muted">
                    {new Date(job.created_at).toLocaleString()}
                  </Text>
                </Box>
                <Badge colorPalette={statusColor(job.status)}>{job.status}</Badge>
              </Flex>

              <SimpleGrid columns={{ base: 2, md: 4 }} gap={3}>
                <Box>
                  <Text fontSize="xs" color="fg.muted" mb={1}>
                    Original
                  </Text>
                  <Image
                    src={job.original_url}
                    alt="original"
                    borderRadius="sm"
                    maxH="120px"
                    objectFit="cover"
                  />
                </Box>
                {job.result_urls.map((url) => (
                  <Box key={url}>
                    <Text fontSize="xs" color="fg.muted" mb={1}>
                      Variant
                    </Text>
                    <Image
                      src={url}
                      alt="variant"
                      borderRadius="sm"
                      maxH="120px"
                      objectFit="cover"
                    />
                  </Box>
                ))}
              </SimpleGrid>

              {job.error ? (
                <Text color="red.500" fontSize="sm" mt={3}>
                  {job.error}
                </Text>
              ) : null}
            </Box>
          ))}
        </VStack>
      </Box>
    </Container>
  )
}
